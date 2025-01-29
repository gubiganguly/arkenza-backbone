export interface User {
  id: string;
  name: string;
  email: string;
  problemWords: string[];
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
  // Add any additional user fields you need
}

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>; 