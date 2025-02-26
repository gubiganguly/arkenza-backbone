"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SlideDeckModalProps } from "@/types/slides";

export function SlideDeckModal({
  isOpen,
  onClose,
  slides,
  finalSlide,
  onFinish
}: SlideDeckModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length + 1; // +1 for final slide

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        {currentSlide < slides.length ? (
          // Regular slides
          <div className="space-y-6">
            <div className="text-center">
              {slides[currentSlide].icon}
              <h2 className="text-2xl font-bold mt-4">{slides[currentSlide].title}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{slides[currentSlide].content}</p>
          </div>
        ) : (
          // Final slide
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{finalSlide.title}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{finalSlide.description}</p>
              <p className="mt-4 font-semibold">Duration: {finalSlide.duration} minutes</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* First Column - Tools Used */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">Tools Used</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  {finalSlide.deviceSettings.map((setting, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {setting.column1.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.label}</span>
                            <Switch 
                              checked={item.enabled}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        {setting.column2.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.label}</span>
                            <Switch 
                              checked={item.enabled}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Second Column - Speech Listeners */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">My Speech is heard by:</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      [
                        { label: 'STT', enabled: false },
                        { label: 'FM', enabled: false },
                        { label: 'chatGPT', enabled: false },
                      ],
                      [
                        { label: 'Human', enabled: false },
                        { label: 'fluencyAI', enabled: false },
                        { label: 'Zoom', enabled: false },
                      ]
                    ].map((column, colIndex) => (
                      <div key={colIndex} className="space-y-4">
                        {column.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.label}</span>
                            <Switch 
                              checked={item.enabled}
                              disabled={true}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600 cursor-not-allowed opacity-50"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {finalSlide.tools.map((tool) => (
                <div key={tool.label} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center gap-2 mb-2">
                    {tool.icon}
                    <h3 className="font-semibold">{tool.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{tool.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={onFinish || onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Begin Exercise
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentSlide < slides.length && (
            <Button onClick={nextSlide}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 