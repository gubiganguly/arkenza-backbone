import { 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config';
import { User, CreateUserData, UpdateUserData } from './userSchema';

const COLLECTION_NAME = 'users';
const usersRef = collection(FIREBASE_DB, COLLECTION_NAME);

export const userModel = {
  // Create a new user
  async create(userId: string, userData: CreateUserData): Promise<User> {
    const userDoc = doc(usersRef, userId);
    
    const user: User = {
      id: userId,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(userDoc, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  },

  // Get user by ID
  async getById(userId: string): Promise<User | null> {
    const userDoc = doc(usersRef, userId);
    const userSnap = await getDoc(userDoc);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();
    return {
      ...userData,
      id: userSnap.id,
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate()
    } as User;
  },

  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    return {
      ...userData,
      id: userDoc.id,
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate()
    } as User;
  },

  // Update user
  async update(userId: string, userData: UpdateUserData): Promise<User> {
    const userDoc = doc(usersRef, userId);
    
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userDoc, updateData);
    
    const updatedUser = await this.getById(userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return updatedUser;
  },

  // Delete user
  async delete(userId: string): Promise<void> {
    const userDoc = doc(usersRef, userId);
    await deleteDoc(userDoc);
  }
}; 