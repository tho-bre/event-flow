import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  throw new Error('Firebase API Key is missing. Check your environment variables.');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase config loaded:', {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId
});

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser doesn\'t support all of the features required to enable persistence');
  }
});

// Security rules to prevent exceeding free tier
export const FIREBASE_LIMITS = {
  maxDailyReads: 50000,
  maxDailyWrites: 20000,
  maxDailyDeletes: 20000,
  maxDocumentSize: 1048576, // 1 MB in bytes
  maxCollectionQueries: 1000,
};

// Helper function to check document size
export const checkDocumentSize = (data: any): boolean => {
  const size = new TextEncoder().encode(JSON.stringify(data)).length;
  return size <= FIREBASE_LIMITS.maxDocumentSize;
};