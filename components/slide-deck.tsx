"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Volume2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Markdown from "react-markdown"
import type { ModuleContent } from "@/types/slides"

interface SlideDeckProps {
  module: ModuleContent
}

export function SlideDeck({ module }: SlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    if (currentSlide < module.slides.length - 1) {
      setCurrentSlide((curr) => curr + 1)
    }
  }

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((curr) => curr - 1)
    }
  }

  const readAloud = () => {
    console.log(`I'm reading this aloud: ${module.slides[currentSlide].content}`)
  }

  return (
    <div className="relative min-h-[600px] p-8">
      {/* Back button */}
      <div className="absolute left-8 top-8">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-gray-600 hover:text-gray-900">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-950">{module.title}</h1>
          <p className="text-sm text-gray-600">
            Slide {currentSlide + 1} of {module.slides.length}
          </p>
        </div>

        <Card className="relative mb-8 min-h-[400px] w-full max-w-3xl p-8">
          <div className="prose mx-auto max-w-none">
            <Markdown>{module.slides[currentSlide].content}</Markdown>
          </div>

          <div className="absolute bottom-4 right-4">
            <Button variant="outline" size="icon" onClick={readAloud} className="rounded-full">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={previousSlide} disabled={currentSlide === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={nextSlide} disabled={currentSlide === module.slides.length - 1}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

