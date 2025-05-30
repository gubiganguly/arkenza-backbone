'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FIREBASE_AUTH } from '@/lib/firebase/config';
import { userModel } from '@/lib/firebase/users/userModel';
import { User } from '@/lib/firebase/users/userSchema';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserNav } from "@/app/components/user-nav";

export default function OASESSurvey({ params }: { params: { uid: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const uid = params.uid;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authUser = FIREBASE_AUTH.currentUser;
        if (!authUser) {
          router.push('/');
          return;
        }

        // Verify the logged-in user matches the requested UID
        if (authUser.uid !== params.uid) {
          router.push(`/dashboard/${authUser.uid}`);
          return;
        }

        const userData = await userModel.getById(params.uid);
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [params.uid, router]);

  const handleComplete = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Update the current module's status and unlock the next one
      const currentModuleId = 2; // OASES Survey module ID
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

      // Update the module status
      await userModel.update(params.uid, {
        modulesCompleted: updatedModules
      });
      
      // Redirect to dashboard
      router.push(`/dashboard/${params.uid}`);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
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

      <div className="mx-auto max-w-3xl pt-12">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-950">OASES Survey</h1>
          <p className="mt-1 text-gray-600">
            Complete the assessment to help evaluate your experience with stuttering
          </p>
        </div>

        <Card className="p-8 bg-white shadow-sm">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">Overall Assessment of the Speaker's Experience of Stuttering</h2>
              <p className="text-gray-600 mb-6">
                This survey will help us understand your experience with stuttering in order to provide better support.
                The assessment will take approximately 60 minutes to complete.
              </p>
              
              <div className="mt-8 flex justify-center">
                <Link href="https://oases-form.vercel.app/" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:scale-[1.02]">
                    Go to OASES Survey
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-100">
              <p>Note: The survey will open in a new tab. After completing the survey, click the "Completed" button below to mark this module as finished and proceed to the next step.</p>
            </div>
          </div>
        </Card>
        
        <div className="text-center mt-6">
          <Button
            onClick={handleComplete}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 transition-all duration-300"
          >
            {isUpdating ? "Updating..." : "Completed"}
          </Button>
        </div>
      </div>
    </div>
  );
} 