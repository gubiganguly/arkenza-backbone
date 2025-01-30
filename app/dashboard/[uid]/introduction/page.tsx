'use client';

import { SlideDeck } from "@/components/slide-deck";
import { introductionModule } from "./introduction";
import { useEffect, useState } from "react";
import { User } from "@/lib/firebase/users/userSchema";
import { userModel } from "@/lib/firebase/users/userModel";

export default function IntroductionPage({ params }: { params: { uid: string } }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await userModel.getById(params.uid);
      if (userData) {
        setUser(userData);
      }
    };

    loadUser();
  }, [params.uid]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SlideDeck 
      module={introductionModule} 
      userId={params.uid}
      currentUser={user}
    />
  );
}