"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Check, RefreshCw, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextHighlighter from "@/app/components/text-highlighter/TextHighlighter";
import { useRouter } from "next/navigation";
import { userModel } from "@/lib/firebase/users/userModel";
import { User, ProblemWord } from "@/lib/firebase/users/userSchema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add these interfaces for API response types
interface GenerateTextResponse {
  text: string;
  totalWordCount: number;
  newUniqueWords: string[];
  newUniqueWordCount: number;
  success: boolean;
  problematicWords?: string[];
  generationTimeMs: number;
  startTime: string;
}

// Add a helper function to safely format the frequency
const formatFrequency = (frequency: number | undefined | null): string => {
  if (frequency === undefined || frequency === null || isNaN(frequency)) {
    return 'N/A';
  }
  return frequency.toExponential(3);
};

// Add this helper function near the top with the other helpers
const calculateTotalFrequency = (words: ProblemWord[]): number => {
  return words.reduce((sum, pw) => sum + (pw.frequency || 0), 0);
};

// Add this type near the top with other interfaces
type SortOrder = 'alphabetical' | 'frequency' | 'lastAdded';

// Add these helper functions near other helper functions
const sortProblemWords = (words: ProblemWord[], sortOrder: SortOrder): ProblemWord[] => {
  const wordsCopy = [...words];
  
  switch (sortOrder) {
    case 'alphabetical':
      return wordsCopy.sort((a, b) => a.word.localeCompare(b.word));
    case 'frequency':
      return wordsCopy.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    case 'lastAdded':
      return wordsCopy; // Already in order of addition
    default:
      return wordsCopy;
  }
};

// Add helper function to format time
const formatGenerationTime = (ms: number): string => {
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function ProblemWords({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [problemWords, setProblemWords] = useState<ProblemWord[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [text, setText] = useState<string>("Click generate to create a new passage.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [isClearing, setIsClearing] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // Add new state variables for word statistics
  const [totalWordCount, setTotalWordCount] = useState<number>(0);
  const [newUniqueWords, setNewUniqueWords] = useState<string[]>([]);

  // Add new state for clearing unique words list
  const [isClearingUniqueWords, setIsClearingUniqueWords] = useState(false);

  // Add new state for word usage preferences
  const [hideProblemWords, setHideProblemWords] = useState(true);
  const [emphasizeProblemWords, setEmphasizeProblemWords] = useState(false);

  // Add this state near other state declarations
  const [sortOrder, setSortOrder] = useState<SortOrder>('lastAdded');

  // Add state for generation data
  const [generationData, setGenerationData] = useState<GenerateTextResponse | null>(null);

  // Add state for passage timing
  const [passageStartTime, setPassageStartTime] = useState<string | null>(null);

  // Add this to your state declarations
  const [temperature, setTemperature] = useState<number>(0.7); // Default to 0.7

  // Add these new state variables for topic rotation
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(0);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState<number>(0);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentSubtopic, setCurrentSubtopic] = useState<string>("");

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
        setProblemWords(userData.problemWords);
      }
    };

    loadUser();
  }, [params.uid]);

  useEffect(() => {
    if (user?.interests && user.interests.length > 0) {
      // Initialize with the first topic and subtopic
      const firstTopic = user.interests[0];
      setCurrentTopicIndex(0);
      setCurrentSubtopicIndex(0);
      setCurrentTopic(firstTopic.name);
      
      if (firstTopic.subInterests && firstTopic.subInterests.length > 0) {
        setCurrentSubtopic(firstTopic.subInterests[0]);
      } else {
        setCurrentSubtopic("General");
      }
    }
  }, [user?.interests]);

  useEffect(() => {
    const savedTemp = localStorage.getItem('llm-temperature');
    if (savedTemp) {
      setTemperature(Number(savedTemp));
    }
  }, []);

  const addBadWord = async (word: string) => {
    // Check if word already exists
    if (!problemWords.some(pw => pw.word === word)) {
      try {
        const response = await fetch('/api/word-frequency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word })
        });

        if (!response.ok) throw new Error('Failed to get word frequency');
        
        const { frequency } = await response.json();
        
        setProblemWords(prev => [...prev, { word, frequency }]);
      } catch (error) {
        console.error('Error getting word frequency:', error);
        // Add word with 0 frequency if lookup fails
        setProblemWords(prev => [...prev, { word, frequency: 0 }]);
      }
    }
  };

  const removeBadWord = (word: string) => {
    setProblemWords(prev => prev.filter(pw => pw.word !== word));
  };

  const handleFinish = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      const currentModuleId = 3;
      const nextModuleId = currentModuleId + 1;

      const updatedModules = user.modulesCompleted.map(module => {
        if (module.id === currentModuleId) {
          return { ...module, isCompleted: true };
        }
        if (module.id === nextModuleId) {
          return { ...module, isUnlocked: true };
        }
        return module;
      });

      // Save problem words and modules, but store temperature in localStorage
      await userModel.update(params.uid, {
        problemWords: problemWords,
        modulesCompleted: updatedModules
      });

      // Store temperature in localStorage
      localStorage.setItem('llm-temperature', temperature.toString());

      // Send timing data before finishing
      if (passageStartTime) {
        await fetch('/api/passage-timing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.uid,
            startTime: passageStartTime,
            endTime: new Date().toISOString()
          })
        });
      }

      router.push(`/dashboard/${params.uid}`);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearNonFrequentWords = async () => {
    if (!user) return;

    try {
      setIsClearing(true);

      // Update the problem words to an empty array
      await userModel.update(params.uid, {
        usedNonFrequentWords: []
      });

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        usedNonFrequentWords: []
      } : null);
    } catch (error) {
      console.error('Error clearing non-frequent words:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Add this function to advance to the next topic/subtopic
  const advanceToNextTopic = () => {
    if (!user?.interests || user.interests.length === 0) return;
    
    const currentTopic = user.interests[currentTopicIndex];
    const hasSubtopics = currentTopic.subInterests && currentTopic.subInterests.length > 0;
    
    // If we have subtopics and haven't gone through all of them yet
    if (hasSubtopics && currentSubtopicIndex < currentTopic.subInterests.length - 1) {
      // Move to next subtopic
      const nextSubtopicIndex = currentSubtopicIndex + 1;
      setCurrentSubtopicIndex(nextSubtopicIndex);
      setCurrentSubtopic(currentTopic.subInterests[nextSubtopicIndex]);
    } else {
      // Move to next topic
      const nextTopicIndex = (currentTopicIndex + 1) % user.interests.length;
      setCurrentTopicIndex(nextTopicIndex);
      setCurrentSubtopicIndex(0);
      
      const nextTopic = user.interests[nextTopicIndex];
      setCurrentTopic(nextTopic.name);
      
      if (nextTopic.subInterests && nextTopic.subInterests.length > 0) {
        setCurrentSubtopic(nextTopic.subInterests[0]);
      } else {
        setCurrentSubtopic("General");
      }
    }
  };

  // Modify the generateNewPassage function to use current topic/subtopic
  const generateNewPassage = async () => {
    if (!currentTopic) {
      setError("No topics available");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Find the current topic object
      const topicObj = user?.interests.find(i => i.name === currentTopic);
      if (!topicObj) {
        throw new Error('Current topic not found');
      }

      // Save current problem words before generating new passage
      if (problemWords.length > 0 && user) {
        await userModel.update(params.uid, {
          problemWords: problemWords
        });
      }

      // If there's an existing passage, send timing data before generating new one
      if (passageStartTime) {
        await fetch('/api/passage-timing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.uid,
            startTime: passageStartTime,
            endTime: new Date().toISOString()
          })
        });
      }

      // Generate new passage with current topic and subtopic
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interest: currentTopic,
          subInterests: currentSubtopic !== "General" ? [currentSubtopic] : [],
          userId: params.uid,
          problemWords,
          hideProblemWords,
          emphasizeProblemWords,
          temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate text');
      }

      const data: GenerateTextResponse = await response.json();
      
      if (data.text === "Not able to generate a passage with the selected problem words") {
        const problemWordsMessage = data.problematicWords && data.problematicWords.length > 0
          ? `I am not able to generate a passage with these words: ${data.problematicWords.map(word => `**${word}**`).join(', ')}. Try removing some of these words or regenerating the passage.`
          : '';
        
        setError(
          `Could not generate text avoiding all problem words. ${problemWordsMessage}`
        );
        return;
      }

      // Update state with new text and statistics
      setText(data.text);
      setTotalWordCount(data.totalWordCount);
      setNewUniqueWords(data.newUniqueWords);
      setGenerationData(data);
      
      // Store new passage start time from API response
      setPassageStartTime(data.startTime);
      
      // Advance to the next topic/subtopic after successful generation
      advanceToNextTopic();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      console.error('Error generating text:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add function to clear unique words
  const handleClearUniqueWords = async () => {
    if (!user) return;

    try {
      setIsClearingUniqueWords(true);
      await userModel.update(params.uid, {
        uniqueWordsEncountered: []
      });

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        uniqueWordsEncountered: []
      } : null);
    } catch (error) {
      console.error('Error clearing unique words:', error);
    } finally {
      setIsClearingUniqueWords(false);
    }
  };

  // Add this just before the interest selector in the JSX
  const wordUsageControls = (
    <div className="flex items-center gap-4 mb-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hideProblemWords}
          onChange={(e) => {
            setHideProblemWords(e.target.checked);
            if (e.target.checked) {
              setEmphasizeProblemWords(false);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">Hide Problem Words</span>
      </label>
      <label className="flex items-center gap-2"> 
        <input
          type="checkbox"
          checked={emphasizeProblemWords}
          onChange={(e) => {
            setEmphasizeProblemWords(e.target.checked);
            if (e.target.checked) {
              setHideProblemWords(false);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">Practice Problem Words</span>
      </label>
      
      {/* Add this new temperature control */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600 dark:text-gray-400">Creativity:</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={temperature}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 0 && value <= 1) {
              setTemperature(value);
            }
          }}
          className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
        />
      </div>
    </div>
  );

  // Replace the topic selector with this display component
  const topicAndGenerateSection = (
    <div className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Topic:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{currentTopic}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtopic:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{currentSubtopic}</span>
          </div>
        </div>
        
        <Button
          onClick={generateNewPassage}
          disabled={isGenerating || !currentTopic}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full md:w-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Generate New Passage
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-950 p-8">
      {/* Back button */}
      <div className="absolute left-8 top-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <Link href={`/dashboard/${params.uid}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-7xl pt-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-950 dark:text-blue-100">Problem Words</h1>
          <p className="mt-2 text-gray-600 flex items-center justify-center gap-1">
            Click on words that are difficult to pronounce
            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm font-medium"
            >
              More Info
            </button>
          </p>
          {showMoreInfo && (
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
              Please take some time to read through a few passages and identify words that you may have trouble pronouncing. You can generate new passages and select words in that passage to take note of which words are causing you problems. Once you are done, click the Finish button to save your problem words.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Text generation section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              {wordUsageControls}
              {topicAndGenerateSection}

              {error && (
                <p 
                  className="text-sm text-red-500 dark:text-red-400"
                  dangerouslySetInnerHTML={{
                    __html: error.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                  }}
                />
              )}

              {/* Text passage */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <TextHighlighter
                  text={text}
                  highlightedWords={problemWords.map(pw => pw.word)}
                  addBadWord={addBadWord}
                  removeBadWord={removeBadWord}
                />
              </div>

              {/* Word Statistics moved to bottom */}
              {totalWordCount > 0 && generationData && (
                <div className="flex items-center justify-end gap-6 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Generation Time: </span>
                    <span className="text-blue-600 dark:text-blue-400">{formatGenerationTime(generationData.generationTimeMs)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Words: </span>
                    <span className="text-blue-600 dark:text-blue-400">{totalWordCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">New Unique Words: </span>
                    <span className="text-blue-600 dark:text-blue-400">{newUniqueWords.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Problem Words Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-blue-950 dark:text-blue-100">Saved Problem Words</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click the trash icon to remove a word</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: SortOrder) => setSortOrder(value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastAdded">Last Added</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Add Unique Words Stats */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Total Unique Words Encountered: </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {user?.uniqueWordsEncountered?.length || 0}
                </span>
              </div>
              <Button
                onClick={handleClearUniqueWords}
                disabled={isClearingUniqueWords || !(user?.uniqueWordsEncountered?.length > 0)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isClearingUniqueWords ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Clear Unique Words
                  </>
                )}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortProblemWords(problemWords, sortOrder).map((pw) => (
                  <TableRow key={pw.word}>
                    <TableCell className="font-medium">{pw.word}</TableCell>
                    <TableCell>{formatFrequency(pw.frequency)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBadWord(pw.word)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {pw.word}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {problemWords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 dark:text-gray-400">
                      No problem words added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-medium">
                    <TableCell>Total Frequency</TableCell>
                    <TableCell>{formatFrequency(calculateTotalFrequency(problemWords))}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={handleFinish}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUpdating ? (
              <span className="flex items-center">
                Updating...
              </span>
            ) : (
              <span className="flex items-center">
                Finish
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}