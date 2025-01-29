"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GSELayout } from "@/components/gse-layout";
import { useAppState } from "../../../contexts/AppStateContext";
import { Badge } from "@/components/ui/badge";
import TextHighlighter from "../../../components/text-highlighter/TextHighlighter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GSE1Page() {
  const { state, setProblemWords } = useAppState();
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const addBadWord = (word: string) => {
    setProblemWords([...state.problemWords, word]);
  };

  const removeBadWord = (word: string) => {
    setProblemWords(state.problemWords.filter((w) => w !== word));
  };

  const handleGenerate = async () => {
    if (!selectedInterest) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/llm?interest=${encodeURIComponent(
          selectedInterest
        )}&badWords=${encodeURIComponent(
          state.problemWords.join(",")
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
            {state.problemWords.map((word) => (
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
                {state.interests.map((interest) => (
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
                highlightedWords={state.problemWords}
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
    </GSELayout>
  );
}
