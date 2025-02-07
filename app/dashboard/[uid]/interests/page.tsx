"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { userModel } from "@/lib/firebase/users/userModel";
import { User, Interest } from "@/lib/firebase/users/userSchema";

// Predefined interests and sub-interests
const PREDEFINED_INTERESTS: Record<string, string[]> = {
  "Travel": ["Adventure", "Luxury", "Backpacking", "Cultural", "Food Tourism"],
  "Business": ["Entrepreneurship", "Marketing", "Finance", "Management", "Startups"],
  "Technology": ["AI", "Programming", "Gadgets", "Cybersecurity", "Web Development"],
  "Sports": ["Football", "Basketball", "Tennis", "Swimming", "Yoga"],
  "Music": ["Rock", "Classical", "Jazz", "Pop", "Electronic"],
  "Movies": ["Action", "Drama", "Comedy", "Sci-Fi", "Documentary"],
  "Food": ["Cooking", "Baking", "Restaurant", "Healthy Eating", "Wine"],
  "Art": ["Painting", "Photography", "Sculpture", "Digital Art", "Design"],
  "Literature": ["Fiction", "Non-Fiction", "Poetry", "Comics", "Journalism"],
  "Science": ["Physics", "Biology", "Chemistry", "Astronomy", "Psychology"],
  "History": ["Ancient", "Medieval", "Modern", "World War", "Art History"],
  "Politics": ["International Relations", "Economics", "Social Issues", "Environment", "Law"]
};

export default function InterestsPage({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
        setInterests(userData.interests);
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
      // Update the selected interest to reflect the changes
      const updatedSelectedInterest = updatedInterests.find(i => i.name === parentInterest.name);
      if (updatedSelectedInterest) {
        setSelectedInterest(updatedSelectedInterest);
      }
    }
  };

  const removeInterest = (interestName: string) => {
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
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
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

      <div className="mx-auto max-w-2xl pt-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-950">Your Interests</h1>
          <p className="mt-2 text-gray-600 flex items-center justify-center gap-2">
            Select your interests and their specific sub-topics
            <span className="relative group">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
                Please select some subjects you are interested in. These interests will be used to generate passages in future exercises.
              </span>
            </span>
          </p>
        </div>

        <Card className="mb-8 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 font-semibold">Available Interests</h2>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PREDEFINED_INTERESTS).map((interest) => {
                  const isSelected = interests.some(i => i.name === interest);
                  return (
                    <Badge
                      key={interest}
                      variant={isSelected ? "secondary" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 ${
                        isSelected ? 'bg-blue-200' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          addInterest(interest);
                        } else {
                          const existingInterest = interests.find(i => i.name === interest);
                          if (existingInterest) {
                            setSelectedInterest(existingInterest);
                          }
                        }
                      }}
                    >
                      {interest}
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInterest(interest);
                          }}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {interests.map((interest) => (
              <div key={interest.name} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Sub-interests for {interest.name}</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {interest.subInterests.map((subInterest) => (
                      <Badge
                        key={subInterest}
                        variant="secondary"
                        className="gap-1 px-2 py-1"
                      >
                        {subInterest}
                        <button
                          onClick={() => removeSubInterest(interest, subInterest)}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Available sub-interests:</h4>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_INTERESTS[interest.name]
                        .filter(sub => !interest.subInterests.includes(sub))
                        .map((sub) => (
                          <Badge
                            key={sub}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => addSubInterest(interest, sub)}
                          >
                            {sub}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleFinish}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? "Updating..." : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );
}