"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GSELayout } from "@/components/gse-layout";
import { useAppState } from "../../contexts/AppStateContext";
import { Badge } from "@/components/ui/badge";

export default function GSE1Page() {
  const { state } = useAppState();
  const [isRecording, setIsRecording] = useState(false);

  const startWhisperRecording = () => {
    setIsRecording(true);
    // Add Whisper API integration logic here
    console.log("Starting recording...");
  };

  const stopWhisperRecording = () => {
    setIsRecording(false);
    // Add logic to stop recording and process audio
    console.log("Stopping recording...");
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

          <h2 className="text-xl font-semibold mb-4">Your Interests</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {state.interests.map((interest) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>

          <p className="text-lg">
            Click the microphone button and read this text aloud. The system
            will analyze your pronunciation and provide feedback.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            onClick={isRecording ? stopWhisperRecording : startWhisperRecording}
            className="gap-2"
          >
            <Volume2 className="h-5 w-5" />
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
      </Card>
    </GSELayout>
  );
}
