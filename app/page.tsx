import Link from "next/link";
import { Check, Clock, Lock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserNav } from "./components/user-nav";

interface Module {
  id: number;
  name: string;
  description?: string;
  estimatedTime: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  href: string;
}

const modules: Module[] = [
  {
    id: 1,
    name: "Introduction",
    description: "Get started with the basics of the fluency program",
    estimatedTime: 5,
    isUnlocked: true,
    isCompleted: true,
    href: "/introduction",
  },
  {
    id: 2,
    name: "Interests",
    description: "Tell us about your interests!",
    estimatedTime: 2,
    isUnlocked: true,
    isCompleted: true,
    href: "/interests",
  },
  {
    id: 3,
    name: "Collect Problematic Worlds",
    description: "Identify words that are difficult for you to pronounce",
    estimatedTime: 60,
    isUnlocked: true,
    isCompleted: false,
    href: "/problem_words",
  },
  {
    id: 4,
    name: "GSE 1",
    description: "Read Sanitized Text Alone",
    estimatedTime: 120,
    isUnlocked: true,
    isCompleted: false,
    href: "/gse/1",
  },
  {
    id: 5,
    name: "GSE 2",
    description: "Intermediate speaking exercises focusing on fluency",
    estimatedTime: 0,
    isUnlocked: false,
    isCompleted: false,
    href: "/gse/2",
  },
  {
    id: 6,
    name: "GSE 3",
    description: "Advanced communication skills and complex topics",
    estimatedTime: 0,
    isUnlocked: false,
    isCompleted: false,
    href: "/gse/3",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-blue-950">
              Arkenza Fluency Program
            </h1>
            <p className="text-xl text-blue-800">Welcome back</p>
          </div>
          <UserNav />
        </div>

        <div className="space-y-6">
          {modules.map((module) => (
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
