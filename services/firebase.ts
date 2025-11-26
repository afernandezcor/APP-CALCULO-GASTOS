import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Helper to safely get environment variables in various environments (Vite, Vercel, Playground)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Configuration uses VITE_ prefix variables for Vercel/Vite
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Singleton instance
let db: any = null;

try {
  // Check if API key is present (and not the placeholder)
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
  } else {
      console.warn("Firebase config missing or invalid. Using Local Storage fallback.");
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
          console.error("CRITICAL: Firebase Env Vars are missing in Vercel!");
      }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db };