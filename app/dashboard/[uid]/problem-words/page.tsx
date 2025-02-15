"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Check, RefreshCw, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextHighlighter from "@/app/components/text-highlighter/TextHighlighter";
import { useRouter } from "next/navigation";
import { userModel } from "@/lib/firebase/users/userModel";
import { User } from "@/lib/firebase/users/userSchema";
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
}

export default function ProblemWords({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [problemWords, setProblemWords] = useState<string[]>([]);
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
    if (user?.interests && user.interests.length > 0 && !selectedInterest) {
      setSelectedInterest(user.interests[0].name);
    }
  }, [user?.interests, selectedInterest]);

  const addBadWord = (word: string) => {
    if (!problemWords.includes(word)) {
      setProblemWords(prev => [...prev, word]);
    }
  };

  const removeBadWord = (word: string) => {
    setProblemWords(prev => prev.filter(w => w !== word));
  };

  const handleFinish = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      const currentModuleId = 3; // Problem Words module ID
      const nextModuleId = currentModuleId + 1;

      // Update the current module's status and unlock the next one
      const updatedModules = user.modulesCompleted.map(module => {
        if (module.id === currentModuleId) {
          return { ...module, isCompleted: true };
        }
        if (module.id === nextModuleId) {
          return { ...module, isUnlocked: true };
        }
        return module;
      });

      // Update both the problem words and module status
      await userModel.update(params.uid, {
        problemWords: problemWords,
        modulesCompleted: updatedModules
      });

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

  const generateNewPassage = async () => {
    if (!selectedInterest) {
      setError("Please select an interest first");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Find the selected interest and its subInterests
      const interestObj = user?.interests.find(i => i.name === selectedInterest);
      if (!interestObj) {
        throw new Error('Selected interest not found');
      }

      // Save current problem words before generating new passage
      if (problemWords.length > 0 && user) {
        await userModel.update(params.uid, {
          problemWords: problemWords
        });
      }

      // Generate new passage with updated API parameters
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interest: selectedInterest,
          subInterests: interestObj.subInterests,
          userId: params.uid,
          problemWords,
          hideProblemWords,
          emphasizeProblemWords
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate text');
      }

      const data: GenerateTextResponse = await response.json();
      
      if (data.text === "Not able to generate a passage with the selected problem words") {
        setError("Could not generate text avoiding all problem words. Try removing some problem words.");
        return;
      }

      // Update state with new text and statistics
      setText(data.text);
      setTotalWordCount(data.totalWordCount);
      setNewUniqueWords(data.newUniqueWords);

      // Update local user state with new unique words
      if (data.newUniqueWords.length > 0 && user) {
        const updatedUniqueWords = [...(user.uniqueWordsEncountered || []), ...data.newUniqueWords];
        setUser(prev => prev ? {
          ...prev,
          uniqueWordsEncountered: updatedUniqueWords
        } : null);
      }

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
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                <div className="w-full md:w-[300px]">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Select an interest
                    </p>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                        Please select one of your interests. This interest will be used to generate the text passage below
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <Select
                    value={selectedInterest}
                    onValueChange={setSelectedInterest}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.interests?.map((interest) => (
                        <SelectItem key={interest.name} value={interest.name}>
                          {interest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateNewPassage}
                  disabled={isGenerating || !selectedInterest}
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

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* Text passage */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <TextHighlighter
                  text={text}
                  highlightedWords={problemWords}
                  addBadWord={addBadWord}
                  removeBadWord={removeBadWord}
                />
              </div>

              {/* Word Statistics moved to bottom */}
              {totalWordCount > 0 && (
                <div className="flex items-center justify-end gap-6 text-sm">
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
              <h2 className="text-xl font-semibold text-blue-950 dark:text-blue-100">Saved Problem Words</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click the trash icon to remove a word</p>
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problemWords.map((word) => (
                  <TableRow key={word}>
                    <TableCell className="font-medium">{word}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBadWord(word)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {word}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {problemWords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 dark:text-gray-400">
                      No problem words added yet
                    </TableCell>
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