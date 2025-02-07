"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GSELayout } from "@/components/gse-layout";
import { Badge } from "@/components/ui/badge";
import TextHighlighter from "@/app/components/text-highlighter/TextHighlighter";
import { userModel } from "@/lib/firebase/users/userModel";
import { User } from "@/lib/firebase/users/userSchema";
import { useRouter } from "next/navigation";
import { RotateCcw, RefreshCw, BookOpen, Mic, Brain, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HELP_TEXT = `Please take some time to read through a few passages and identify words that you may have trouble pronouncing. You can generate new passages and select words in that passage to take note of which words are causing you problems. Once you are done, click the Finish button to save your problem words.`;

const INTRO_TEXT = `In this exercise, you'll practice reading passages out loud while identifying words that are challenging to pronounce. This will help improve your pronunciation skills and build confidence in speaking English.`;

const EXERCISE_STEPS = [
  "Generate passages about topics that interest you",
  "Read the passages out loud",
  "Click on words that are difficult to pronounce",
  "Practice these words to improve your pronunciation"
];

const TOOL_DESCRIPTIONS = {
  reading: "Practice reading passages aloud to improve pronunciation",
  speaking: "Focus on clear speech and proper word pronunciation",
  learning: "Learn and track challenging words to enhance vocabulary"
};

export default function GSE1Page({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [problemWords, setProblemWords] = useState<string[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("Click generate to create a new passage.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);

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

  const handleClearNonFrequentWords = async () => {
    if (!user) return;

    try {
      setIsClearing(true);
      await userModel.update(params.uid, {
        usedNonFrequentWords: []
      });
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
      setGeneratedText(data.text);

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

  const addBadWord = async (word: string) => {
    if (!user || problemWords.includes(word)) return;

    const newProblemWords = [...problemWords, word];
    setProblemWords(newProblemWords);

    try {
      await userModel.update(params.uid, {
        problemWords: newProblemWords
      });
    } catch (error) {
      console.error('Error updating problem words:', error);
      // Revert the state if the update fails
      setProblemWords(problemWords);
    }
  };

  const removeBadWord = async (word: string) => {
    if (!user) return;

    const newProblemWords = problemWords.filter(w => w !== word);
    setProblemWords(newProblemWords);

    try {
      await userModel.update(params.uid, {
        problemWords: newProblemWords
      });
    } catch (error) {
      console.error('Error updating problem words:', error);
      // Revert the state if the update fails
      setProblemWords(problemWords);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      const currentModuleId = 4; // GSE 1 module ID
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

      await userModel.update(params.uid, {
        modulesCompleted: updatedModules
      });

      router.push(`/dashboard/${params.uid}`);
    } catch (error) {
      console.error('Error updating module status:', error);
    } finally {
      setIsUpdating(false);
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
    <GSELayout>
      {/* Intro Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[525px] w-full p-6 shadow-xl">
            {/* Modal Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-950 dark:text-blue-100">
                GSE 1: Read Aloud Exercise
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {INTRO_TEXT}
              </p>
            </div>

            {/* Exercise Steps */}
            <div className="mt-6 space-y-4">
              {EXERCISE_STEPS.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {/* Tools Section */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Tools you'll be using:
              </p>
              <div className="flex justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Reading</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Speaking</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Learning</span>
                </div>
              </div>
            </div>

            {/* Begin Button */}
            <Button
              onClick={() => setShowIntroModal(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              Begin Exercise
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-950 dark:text-blue-100">GSE 1: Read Aloud</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
          Practice reading text with clear pronunciation
          <button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm font-medium"
          >
            More Info
          </button>
        </p>

        <div className="flex justify-center gap-8 mt-4">
          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Reading</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
              {TOOL_DESCRIPTIONS.reading}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Speaking</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
              {TOOL_DESCRIPTIONS.speaking}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Learning</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
              {TOOL_DESCRIPTIONS.learning}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>

        {showMoreInfo && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
            {HELP_TEXT}
          </p>
        )}
      </div>

      <Card className="relative mb-8 p-8">
        <div className="prose mx-auto max-w-none">
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

          <h2 className="text-xl font-semibold mb-4">Your Problem Words</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {problemWords.map((word) => (
              <Badge key={word} variant="secondary">
                {word}
              </Badge>
            ))}
          </div>

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
            text={generatedText}
            highlightedWords={problemWords}
            addBadWord={addBadWord}
            removeBadWord={removeBadWord}
          />
          
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
      </Card>

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
    </GSELayout>
  );
}