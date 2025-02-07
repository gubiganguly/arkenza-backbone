"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Check, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextHighlighter from "@/app/components/text-highlighter/TextHighlighter";
import { useRouter } from "next/navigation";
import { userModel } from "@/lib/firebase/users/userModel";
import { User } from "@/lib/firebase/users/userSchema";
import { Info } from "lucide-react";
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

      const response = await fetch(`/api/llm?` + new URLSearchParams({
        interest: selectedInterest,
        subInterests: interestObj.subInterests.join(','),
        userId: params.uid,
        storyTellerMode: "casual"
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate text');
      }

      const data = await response.json();
      setText(data.text);

      // Update local state with new non-frequent words
      if (data.newWords && user) {
        setUser(prev => prev ? {
          ...prev,
          usedNonFrequentWords: [...(prev.usedNonFrequentWords || []), ...data.newWords]
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      console.error('Error generating text:', err);
    } finally {
      setIsGenerating(false);
    }
  };

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
          {/* Text Highlighter Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Please select an interest you would like to generate a passage about
            </p>
            
            <div className="w-full max-w-xs mb-6">
              <Select
                value={selectedInterest}
                onValueChange={setSelectedInterest}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an interest" />
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

            <TextHighlighter
              text={text}
              highlightedWords={problemWords}
              addBadWord={addBadWord}
              removeBadWord={removeBadWord}
            />
            
            {/* Generate Button */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                onClick={generateNewPassage}
                disabled={isGenerating || !selectedInterest}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
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
              
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Problem Words Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-blue-950 dark:text-blue-100">Saved Problem Words</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click the trash icon to remove a word</p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Non-Frequent Words Used: </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {user?.usedNonFrequentWords?.length || 0}
                </span>
              </div>
              <Button
                onClick={handleClearNonFrequentWords}
                disabled={isClearing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Clear List
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