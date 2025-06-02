'use client';

import { useEffect, useState } from "react";
import { User } from "@/lib/firebase/users/userSchema";
import { userModel } from "@/lib/firebase/users/userModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IntroductionPage({ params }: { params: { uid: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
      }
    };

    loadUser();
  }, [params.uid]);

  const handleFinish = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const currentModuleId = 1; // Introduction module ID
      const nextModuleId = 2;    // Interests module ID
      
      const updatedModules = user.modulesCompleted.map(module => {
        if (module.id === currentModuleId) {
          return { ...module, isCompleted: true };
        }
        if (module.id === nextModuleId) {
          return { ...module, isUnlocked: true };
        }
        return module;
      });
      
      await userModel.update(params.uid, {
        modulesCompleted: updatedModules
      });
      
      router.push(`/dashboard/${params.uid}`);
    } catch (error) {
      console.error('Error updating module status:', error);
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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="p-6">
        <Link href={`/dashboard/${params.uid}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm overflow-hidden">
          <iframe 
            className="w-full aspect-video" 
            src="https://www.youtube.com/embed/k6rUEyzaKXE"
            title="Introduction Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
      
      <div className="flex justify-end p-6">
        <Button 
          onClick={handleFinish}
          disabled={isUpdating}
          className="bg-green-500 hover:bg-green-600 text-white px-9 py-3 rounded-md text-lg"
        >
          {isUpdating ? "Updating..." : "Finish"}
        </Button>
      </div>
    </div>
  );
}