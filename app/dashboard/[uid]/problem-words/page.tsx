"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Check } from "lucide-react";
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

const text = `There are many words that are difficult for me to pronounce. I need to identify them and practice them.`;

export default function ProblemWords({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [problemWords, setProblemWords] = useState<string[]>([]);
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Click on words that are difficult to pronounce
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Text Highlighter Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <TextHighlighter
              text={text}
              highlightedWords={problemWords}
              addBadWord={addBadWord}
              removeBadWord={removeBadWord}
            />
          </div>

          {/* Problem Words Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-blue-950 dark:text-blue-100">Saved Problem Words</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click the trash icon to remove a word</p>
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