"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GSELayout } from "@/components/gse-layout";

export default function GSE2Page() {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
    // Add animation logic here
  };

  return (
    <GSELayout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-950">
          GSE 2: Animation Exercise
        </h1>
        <p className="mt-2 text-gray-600">
          Watch and mimic the mouth movements
        </p>
      </div>

      <Card className="relative mb-8 p-8">
        <div className="aspect-video bg-gray-100 mb-6">
          {/* Add your animation component here */}
          <div className="flex items-center justify-center h-full">
            Animation Placeholder
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={toggleAnimation}
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5" />
                Pause Animation
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Play Animation
              </>
            )}
          </Button>
        </div>
      </Card>
    </GSELayout>
  );
}
