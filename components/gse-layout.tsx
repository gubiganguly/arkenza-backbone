import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function GSELayout({ children }: { children: React.ReactNode }, params: { uid: string }) {
  const router = useRouter();
  const uid = params.uid;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="absolute left-8 top-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <Link href={`/dashboard/${uid}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-2xl pt-16">{children}</div>
    </div>
  );
}
