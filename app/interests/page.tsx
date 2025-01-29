"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "../contexts/AppStateContext";

// Predefined interests that we suggest to users
const SUGGESTED_INTERESTS = [
  "Travel",
  "Business",
  "Technology",
  "Sports",
  "Music",
  "Movies",
  "Food",
  "Art",
  "Literature",
  "Science",
  "History",
  "Politics",
];

export default function InterestsPage() {
  const { state, setInterests } = useAppState();
  const [newInterest, setNewInterest] = useState("");

  const addInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !state.interests.includes(trimmedInterest)) {
      const newInterests = [...state.interests, trimmedInterest];
      setInterests(newInterests);
    }
    setNewInterest("");
  };

  const removeInterest = (interest: string) => {
    const newInterests = state.interests.filter((i) => i !== interest);
    setInterests(newInterests);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInterest(newInterest);
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
          <h1 className="text-3xl font-bold text-blue-950">Your Interests</h1>
          <p className="mt-2 text-gray-600">
            Select or add topics you're interested in discussing
          </p>
        </div>

        <Card className="mb-8 p-6">
          <div className="mb-6">
            <h2 className="mb-3 font-semibold">Your Selected Interests</h2>
            <div className="flex flex-wrap gap-2">
              {state.interests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No interests selected yet. Add some below!
                </p>
              ) : (
                state.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="gap-1 px-3 py-1.5"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {interest}</span>
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 font-semibold">Add Custom Interest</h2>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type and press enter..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add interest</span>
              </Button>
            </form>
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Suggested Interests</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_INTERESTS.filter(
                (interest) => !state.interests.includes(interest)
              ).map((interest) => (
                <Badge
                  key={interest}
                  variant="outline"
                  className="cursor-pointer px-3 py-1.5 hover:bg-gray-100"
                  onClick={() => addInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Button asChild>
            <Link href="/">Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
