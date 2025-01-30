"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Volume2, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Markdown from "react-markdown"
import type { ModuleContent } from "@/types/slides"
import { useRouter } from "next/navigation"
import { userModel } from "@/lib/firebase/users/userModel"
import { User } from "@/lib/firebase/users/userSchema"

interface SlideDeckProps {
  module: ModuleContent
  userId: string
  currentUser: User
}

export function SlideDeck({ module, userId, currentUser }: SlideDeckProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const isLastSlide = currentSlide === module.slides.length - 1

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

  const handleFinish = async () => {
    try {
      setIsUpdating(true)
      
      // Get the current module's ID from the first number in the module.id string
      const currentModuleId = parseInt(module.id.match(/\d+/)?.[0] || "1")
      const nextModuleId = currentModuleId + 1

      // Update the current module's status and unlock the next one
      const updatedModules = currentUser.modulesCompleted.map(module => {
        if (module.id === currentModuleId) {
          return { ...module, isCompleted: true }
        }
        if (module.id === nextModuleId) {
          return { ...module, isUnlocked: true }
        }
        return module
      })

      // Update the user's module status
      await userModel.update(userId, {
        modulesCompleted: updatedModules
      })

      // Redirect to dashboard
      router.push(`/dashboard/${userId}`)
    } catch (error) {
      console.error('Error updating module status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const readAloud = () => {
    console.log(`I'm reading this aloud: ${module.slides[currentSlide].content}`)
  }

  return (
    <div className="relative min-h-[600px] p-8">
      {/* Back button */}
      <div className="absolute left-8 top-8">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild 
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <Link href={`/dashboard/${userId}`}>
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
          <Button 
            variant="outline" 
            onClick={previousSlide} 
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          {isLastSlide ? (
            <Button
              onClick={handleFinish}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <span className="flex items-center">
                  Updating...
                </span>
              ) : (
                <span className="flex items-center">
                  Finish <Check className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          ) : (
            <Button 
              onClick={nextSlide} 
              disabled={currentSlide === module.slides.length - 1}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

