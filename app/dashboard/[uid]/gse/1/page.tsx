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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GSE1Page({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [problemWords, setProblemWords] = useState<string[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedInterest) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/llm?interest=${encodeURIComponent(
          selectedInterest
        )}&badWords=${encodeURIComponent(
          problemWords.join(",")
        )}&storyTellerMode=casual`
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedText(data.text);
    } catch (error) {
      console.error("Failed to generate text:", error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-950">GSE 1: Read Aloud</h1>
        <p className="mt-2 text-gray-600">
          Practice reading text with clear pronunciation
        </p>
      </div>

      <Card className="relative mb-8 p-8">
        <div className="prose mx-auto max-w-none">
          <h2 className="text-xl font-semibold mb-4">Your Problem Words</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {problemWords.map((word) => (
              <Badge key={word} variant="secondary">
                {word}
              </Badge>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">Select an Interest</h2>
          <div className="flex gap-4 mb-6">
            <Select
              value={selectedInterest}
              onValueChange={setSelectedInterest}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {user.interests.map((interest) => (
                  <SelectItem key={interest} value={interest}>
                    {interest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerate}
              disabled={!selectedInterest || isLoading}
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>

          {generatedText && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Read this text:</h2>
              <p className="text-sm text-gray-600 mb-4">Click on any words that are difficult to pronounce</p>
              <TextHighlighter
                text={generatedText}
                highlightedWords={problemWords}
                addBadWord={addBadWord}
                removeBadWord={removeBadWord}
              />
            </div>
          )}

          {!generatedText && (
            <p className="text-lg">
              Select an interest and click generate to get a text to read aloud.
              The system will analyze your pronunciation and provide feedback.
            </p>
          )}
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Button
          onClick={handleFinish}
          disabled={isUpdating || !generatedText}
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