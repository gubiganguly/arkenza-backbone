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
  const [state, setState] = useState<AppState>(() => {
    // Load initial state from localStorage if available
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("appState");
      if (savedState) {
        return JSON.parse(savedState);
      }
    }
    return {
      problemWords: [],
      interests: [],
    };
  });

  const setProblemWords = (words: string[]) => {
    setState((prev) => {
      const newState = { ...prev, problemWords: words };
      localStorage.setItem("appState", JSON.stringify(newState));
      return newState;
    });
  };

  const setInterests = (interests: string[]) => {
    setState((prev) => {
      const newState = { ...prev, interests: interests };
      localStorage.setItem("appState", JSON.stringify(newState));
      return newState;
    });
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
