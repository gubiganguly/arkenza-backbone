export interface ModuleStatus {
  id: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  problemWords: string[];
  interests: string[];
  modulesCompleted: ModuleStatus[];
  createdAt: Date; 
  updatedAt: Date;
  // Add any additional user fields you need
}

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>; 