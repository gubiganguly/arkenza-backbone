'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FIREBASE_AUTH } from '@/lib/firebase/config';
import { userModel } from '@/lib/firebase/users/userModel';
import { User } from '@/lib/firebase/users/userSchema';
import Link from "next/link";
import { Check, Clock, Lock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserNav } from "@/app/components/user-nav";

interface Module {
  id: number;
  name: string;
  description?: string;
  estimatedTime: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  href: string;
}

export default function UserDashboard({ params }: { params: { uid: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const uid = params.uid;

  const getModuleStatus = (moduleId: number) => {
    if (!user || !user.modulesCompleted) {
      return { isUnlocked: false, isCompleted: false };
    }
    const status = user.modulesCompleted.find(m => m.id === moduleId);
    return status || { isUnlocked: false, isCompleted: false };
  };

  const modulesWithUid: Module[] = [
    {
      id: 1,
      name: "Introduction",
      description: "Get started with the basics of the fluency program",
      estimatedTime: 15,
      ...getModuleStatus(1),
      href: `/dashboard/${uid}/introduction`,
    },
    {
      id: 2,
      name: "OASES Survey",
      description: "Complete the OASES assessment to help evaluate your experience with stuttering",
      estimatedTime: 60,
      ...getModuleStatus(2),
      href: `/dashboard/${uid}/OASES`,
    },
    {
      id: 3,
      name: "Interests",
      description: "Tell us about your interests!",
      estimatedTime: 2,
      ...getModuleStatus(3),
      href: `/dashboard/${uid}/interests`,
    },
    {
      id: 4,
      name: "Collect Problematic Worlds",
      description: "Identify words that are difficult for you to pronounce",
      estimatedTime: 60,
      ...getModuleStatus(4),
      href: `/dashboard/${uid}/problem-words`,
    },
    {
      id: 5,
      name: "GSE 1",
      description: "Choral Reading of Sanitized Text",
      estimatedTime: 120,
      ...getModuleStatus(5),
      href: `/dashboard/${uid}/gse/1`,
    },
    {
      id: 6,
      name: "GSE 2",
      description: "Choral Reading of Un-Sanitized Text",
      estimatedTime: 0,
      ...getModuleStatus(6),
      href: `/dashboard/${uid}/gse/2`,
    },
    {
      id: 7,
      name: "GSE 3",
      description: "Recite Sanitized Text Alone",
      estimatedTime: 0,
      ...getModuleStatus(7),
      href: `/dashboard/${uid}/gse/3`,
    },
    {
      id: 8,
      name: "GSE 4",
      description: "Recite Un-sanitized Text Alone",
      estimatedTime: 0,
      ...getModuleStatus(8),
      href: `/dashboard/${uid}/gse/4`,
    },
  ];

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (authUser) => {
      if (!authUser) {
        router.push('/');
        return;
      }

      // Verify the logged-in user matches the requested UID
      if (authUser.uid !== params.uid) {
        router.push(`/dashboard/${authUser.uid}`);
        return;
      }

      try {
        const userData = await userModel.getById(params.uid);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [params.uid, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-blue-950">
              Arkenza Fluency Program
            </h1>
            <p className="text-xl text-blue-800">Welcome back, {user?.name}</p>
          </div>
          <UserNav />
        </div>

        <div className="space-y-6">
          {modulesWithUid.map((module) => (
            <Link
              key={module.id}
              href={module.isUnlocked ? module.href : "#"}
              className="block"
            >
              <Card
                className={`relative overflow-hidden p-6 transition-all duration-200 ${
                  !module.isUnlocked
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white hover:shadow-md hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-medium">{module.name}</h2>
                      {module.estimatedTime > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{module.estimatedTime} min</span>
                        </div>
                      )}
                    </div>
                    {module.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {module.isCompleted ? (
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    ) : module.isUnlocked ? (
                      <div className="rounded-full bg-blue-100 p-1">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-gray-100 p-1">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    {module.isUnlocked && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Progress wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                  <svg
                    className="h-8 w-full"
                    viewBox="0 0 400 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 10 Q 100 5 200 10 T 400 10 V 20 H 0 Z"
                      fill={module.isUnlocked ? "#EFF6FF" : "#F3F4F6"}
                      opacity="0.5"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}