"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextHighlighter from "../components/text-highlighter/TextHighlighter";

const text = `There are many words that are difficult for me to pronounce. I need to identify them and practice them.`;

export default function ProblemWords() {
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);

  const addBadWord = (word: string) => {
    setHighlightedWords([...highlightedWords, word]);
  };

  const removeBadWord = (word: string) => {
    setHighlightedWords(highlightedWords.filter((w) => w !== word));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      {/* Back button */}
      <div className="absolute left-8 top-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-2xl pt-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-950">Problem Words</h1>
          <p className="mt-2 text-gray-600">
            Click on words that are difficult to pronounce
          </p>
        </div>

        <TextHighlighter
          text={text}
          highlightedWords={highlightedWords}
          addBadWord={addBadWord}
          removeBadWord={removeBadWord}
        />
      </div>
    </div>
  );
}
