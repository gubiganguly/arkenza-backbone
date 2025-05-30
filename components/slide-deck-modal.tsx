"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
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
  const totalSlides = finalSlide ? slides.length + 1 : slides.length; // Only add 1 if finalSlide exists

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
        ) : finalSlide ? (
          // Final slide (only shown if finalSlide is provided)
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
                    {finalSlide.speechHearingSettings ? (
                      // Use speech hearing settings from finalSlide
                      [
                        finalSlide.speechHearingSettings.slice(0, 3),
                        finalSlide.speechHearingSettings.slice(3)
                      ].map((column, colIndex) => (
                        <div key={colIndex} className="space-y-4">
                          {column.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="mr-2">{item.label}</span>
                                {item.tooltip && (
                                  <div className="relative group">
                                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible 
                                      bg-black text-white text-xs rounded py-1 px-2 w-max transition-opacity opacity-0 group-hover:opacity-100">
                                      {item.tooltip}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Switch 
                                checked={item.enabled}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
                              />
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      // Fallback to hardcoded array if speechHearingSettings is not provided
                      [
                        [
                          { label: 'STT', enabled: false, tooltip: "Speech To Text" },
                          { label: 'FM', enabled: false, tooltip: "Fluency Monitor" },
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
                              <div className="flex items-center">
                                <span className="mr-2">{item.label}</span>
                                {item.tooltip && (
                                  <div className="relative group">
                                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible 
                                      bg-black text-white text-xs rounded py-1 px-2 w-max transition-opacity opacity-0 group-hover:opacity-100">
                                      {item.tooltip}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className={`w-12 h-6 rounded-full transition ${item.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                <div className={`w-5 h-5 rounded-full bg-white transform transition ${item.enabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
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
        ) : null}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentSlide < slides.length - 1 ? (
            <Button onClick={nextSlide}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : currentSlide === slides.length - 1 && !finalSlide ? (
            <Button onClick={onClose}>
              Finish
            </Button>
          ) : currentSlide < totalSlides - 1 ? (
            <Button onClick={nextSlide}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
} 