// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHefG-YMz6RPRe8LkhF41DVQD3BMrWSok",
  authDomain: "arkenza-e09ed.firebaseapp.com",
  projectId: "arkenza-e09ed",
  storageBucket: "arkenza-e09ed.firebasestorage.app",
  messagingSenderId: "684395131823",
  appId: "1:684395131823:web:e6c6c8e4ff32046cf8355a",
  measurementId: "G-HGEHQT2VJ6"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

// Conditionally initialize analytics only in browser environment
export const FIREBASE_ANALYTICS = typeof window !== 'undefined' 
  ? getAnalytics(FIREBASE_APP) 
  : null;
