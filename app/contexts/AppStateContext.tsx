"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppState {
  problemWords: string[];
  interests: string[];
}

interface AppStateContextType {
  state: AppState;
  setProblemWords: (words: string[]) => void;
  setInterests: (interests: string[]) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    problemWords: [],
    interests: [],
  });

  const setProblemWords = (words: string[]) => {
    setState((prev) => ({ ...prev, problemWords: words }));
  };

  const setInterests = (interests: string[]) => {
    setState((prev) => ({ ...prev, interests: interests }));
  };

  return (
    <AppStateContext.Provider value={{ state, setProblemWords, setInterests }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
