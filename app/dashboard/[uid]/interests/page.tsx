"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { userModel } from "@/lib/firebase/users/userModel";
import { User, Interest } from "@/lib/firebase/users/userSchema";

// Predefined interests and sub-interests
const PREDEFINED_INTERESTS: Record<string, string[]> = {
  "Travel": [
    "Adventure", "Luxury", "Backpacking", "Cultural", "Food Tourism",
    "Beach", "Mountain", "City Breaks", "Road Trips", "Historical Sites",
    "Eco Tourism", "Photography"
  ],
  "Business": [
    "Entrepreneurship", "Marketing", "Finance", "Management", "Startups",
    "E-commerce", "Leadership", "Innovation", "Digital Business", "Investment",
    "Business Strategy", "International Trade"
  ],
  "Technology": [
    "AI", "Programming", "Gadgets", "Cybersecurity", "Web Development",
    "Mobile Apps", "Cloud Computing", "Blockchain", "IoT", "Data Science",
    "Machine Learning", "Virtual Reality"
  ],
  "Sports": [
    "Football", "Basketball", "Tennis", "Swimming", "Yoga",
    "Running", "Cycling", "Martial Arts", "Golf", "Volleyball",
    "Fitness", "Winter Sports"
  ],
  "Music": [
    "Rock", "Classical", "Jazz", "Pop", "Electronic",
    "Hip Hop", "Country", "Blues", "Folk", "World Music",
    "Opera", "Musical Theatre"
  ],
  "Movies": [
    "Action", "Drama", "Comedy", "Sci-Fi", "Documentary",
    "Horror", "Animation", "Thriller", "Romance", "Fantasy",
    "Independent Films", "Foreign Cinema"
  ],
  "Food": [
    "Cooking", "Baking", "Restaurant", "Healthy Eating", "Wine",
    "International Cuisine", "Desserts", "Vegetarian", "BBQ", "Seafood",
    "Food Photography", "Coffee & Tea"
  ],
  "Art": [
    "Painting", "Photography", "Sculpture", "Digital Art", "Design",
    "Drawing", "Street Art", "Ceramics", "Art History", "Installation Art",
    "Printmaking", "Contemporary Art"
  ],
  "Literature": [
    "Fiction", "Non-Fiction", "Poetry", "Comics", "Journalism",
    "Classic Literature", "Contemporary", "Mystery", "Science Fiction",
    "Biography", "Essays", "Literary Criticism"
  ],
  "Science": [
    "Physics", "Biology", "Chemistry", "Astronomy", "Psychology",
    "Neuroscience", "Environmental Science", "Genetics", "Space Exploration",
    "Quantum Physics", "Marine Biology", "Climate Science"
  ],
  "History": [
    "Ancient", "Medieval", "Modern", "World War", "Art History",
    "Military History", "Social History", "Archaeological", "Cultural History",
    "Economic History", "Political History", "Maritime History"
  ],
  "Politics": [
    "International Relations", "Economics", "Social Issues", "Environment", "Law",
    "Public Policy", "Political Theory", "Human Rights", "Democracy",
    "Geopolitics", "Diplomacy", "Civil Rights"
  ]
};

export default function InterestsPage({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Add state to track total sub-interests count
  const [totalSubInterests, setTotalSubInterests] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
        setInterests(userData.interests);
        
        // Calculate initial total sub-interests
        const initialTotal = userData.interests.reduce(
          (total, interest) => total + interest.subInterests.length, 0
        );
        setTotalSubInterests(initialTotal);
      }
    };

    loadUser();
  }, [params.uid]);

  const addInterest = (interestName: string) => {
    if (!interests.some(i => i.name === interestName)) {
      const newInterest = { 
        name: interestName, 
        subInterests: [] 
      };
      setInterests(prev => [...prev, newInterest]);
      setSelectedInterest(newInterest); // Automatically select the new interest
    }
  };

  const addSubInterest = (parentInterest: Interest, subInterest: string) => {
    if (!parentInterest.subInterests.includes(subInterest)) {
      const updatedInterests = interests.map(i => 
        i.name === parentInterest.name 
          ? { ...i, subInterests: [...i.subInterests, subInterest] }
          : i
      );
      setInterests(updatedInterests);
      // Update total sub-interests count
      setTotalSubInterests(prev => prev + 1);
      // Update the selected interest to reflect the changes
      const updatedSelectedInterest = updatedInterests.find(i => i.name === parentInterest.name);
      if (updatedSelectedInterest) {
        setSelectedInterest(updatedSelectedInterest);
      }
    }
  };

  const removeInterest = (interestName: string) => {
    // Find the interest to get its sub-interests count before removing
    const interestToRemove = interests.find(i => i.name === interestName);
    if (interestToRemove) {
      // Update total sub-interests count
      setTotalSubInterests(prev => prev - interestToRemove.subInterests.length);
    }
    
    setInterests(prev => prev.filter(i => i.name !== interestName));
    if (selectedInterest?.name === interestName) {
      setSelectedInterest(null);
    }
  };

  const removeSubInterest = (parentInterest: Interest, subInterest: string) => {
    setInterests(prev => prev.map(i =>
      i.name === parentInterest.name
        ? { ...i, subInterests: i.subInterests.filter(sub => sub !== subInterest) }
        : i
    ));
    // Update total sub-interests count
    setTotalSubInterests(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newInterest = formData.get('newInterest') as string;
    addInterest(newInterest);
  };

  const handleFinish = async () => {
    if (!user) return;

    // Check if user has selected at least 25 sub-interests
    if (totalSubInterests < 25) {
      setErrorMessage(`Please select at least 25 sub-interests. You've selected ${totalSubInterests} so far.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setIsUpdating(true);

      // Update interests
      const currentModuleId = 2; // Interests module ID
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

      // Update both the interests and module status
      await userModel.update(params.uid, {
        interests: interests,
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
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      {/* Back button */}
      <div className="absolute left-8 top-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <Link href={`/dashboard/${params.uid}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-6xl pt-12">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-950">Your Interests</h1>
          <p className="mt-1 text-gray-600 flex items-center justify-center gap-2">
            Select your interests and their specific sub-topics
            <span className="relative group">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
                Please select some subjects you are interested in. These interests will be used to generate passages in future exercises.
              </span>
            </span>
          </p>
          
          {/* Add progress indicator */}
          <div className="mt-4 flex flex-col items-center">
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${Math.min(100, (totalSubInterests / 25) * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {totalSubInterests} of 25 required sub-interests selected
              {totalSubInterests >= 25 && (
                <span className="ml-2 text-green-600 inline-flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Ready to proceed
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Display error message if any */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left side - Main interests */}
          <Card className="col-span-7 p-5 h-[500px] overflow-y-auto">
            <h2 className="font-semibold mb-4">Select Your Interests</h2>
            <div className="flex flex-col gap-2">
              {Object.keys(PREDEFINED_INTERESTS).map((interest) => {
                const isSelected = interests.some(i => i.name === interest);
                return (
                  <div
                    key={interest}
                    onClick={() => {
                      const existingInterest = interests.find(i => i.name === interest);
                      if (existingInterest) {
                        setSelectedInterest(existingInterest);
                      } else {
                        setSelectedInterest({ name: interest, subInterests: [] });
                      }
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${selectedInterest?.name === interest ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
                      ${selectedInterest?.name === interest ? 'ring-2 ring-blue-400' : ''}
                      border flex items-center gap-3
                    `}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          removeInterest(interest);
                        } else {
                          addInterest(interest);
                        }
                      }}
                      className={`
                        w-5 h-5 rounded border flex items-center justify-center
                        transition-colors duration-200
                        ${isSelected ? 
                          'bg-blue-500 border-blue-500 text-white' : 
                          'border-gray-300 hover:border-blue-500'
                        }
                      `}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                    <span className="font-medium flex-grow">{interest}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right side - Sub-interests */}
          <Card className="col-span-5 p-5 h-[500px] overflow-y-auto">
            {selectedInterest ? (
              <div className="h-full">
                <h2 className="font-semibold mb-4">
                  Sub-interests for {selectedInterest.name}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {PREDEFINED_INTERESTS[selectedInterest.name].map((sub) => {
                    const currentInterest = interests.find(i => i.name === selectedInterest.name);
                    const isSelected = currentInterest?.subInterests.includes(sub) || false;
                    
                    return (
                      <Badge
                        key={sub}
                        variant={isSelected ? "secondary" : "outline"}
                        className={`
                          cursor-pointer transition-all duration-200 px-2 py-1
                          flex items-center justify-center text-center
                          ${isSelected ? 
                            'bg-blue-100 hover:bg-blue-200 border-blue-200' : 
                            'hover:bg-gray-100'
                          }
                        `}
                        onClick={() => {
                          if (!interests.some(i => i.name === selectedInterest.name)) {
                            setErrorMessage(`Please select "${selectedInterest.name}" first before choosing sub-interests.`);
                            setTimeout(() => setErrorMessage(null), 3000);
                            return;
                          }
                          setErrorMessage(null);

                          // Toggle the sub-interest
                          if (isSelected) {
                            removeSubInterest(currentInterest!, sub);
                          } else {
                            addSubInterest(currentInterest!, sub);
                          }
                        }}
                      >
                        {sub}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Select an interest from the left to manage sub-interests</p>
              </div>
            )}
          </Card>
        </div>

        <div className="text-center mt-6">
          <Button
            onClick={handleFinish}
            disabled={isUpdating || totalSubInterests < 25}
            className={`
              transition-all duration-300
              ${totalSubInterests >= 25 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-400 cursor-not-allowed"}
            `}
          >
            {isUpdating ? "Updating..." : "Finish"}
          </Button>
          
          {totalSubInterests < 25 && (
            <p className="mt-2 text-amber-600 text-sm">
              Please select {25 - totalSubInterests} more sub-interests to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}