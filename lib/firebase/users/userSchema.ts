export interface ModuleStatus {
  id: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface Interest {
  name: string;
  subInterests: string[];
}

export interface ProblemWord {
  word: string;
  frequency: number;
}

export interface PassageMetadata {
  newUniqueWordCount: number;
  generationTimeMs: number;
  success: boolean;
  startTime: Date;
  endTime: Date;
  timeSpentMs: number;
  totalWordCount: number;
}

export interface User { 
  id: string;
  name: string;
  email: string;
  problemWords: ProblemWord[];
  interests: Interest[];
  modulesCompleted: ModuleStatus[];
  usedNonFrequentWords: string[];
  uniqueWordsEncountered: string[];
  passageHistory: PassageMetadata[];
  createdAt: Date; 
  updatedAt: Date; 
  // Add any additional user fields you need
}

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>; 