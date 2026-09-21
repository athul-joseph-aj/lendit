// src/firebase/firebase.js
// Firebase is initialized here using environment variables.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase web configuration is public by design. Keep a fallback here so a
// missing Vercel environment configuration cannot prevent the entire app from
// rendering. Vercel/local environment variables still take precedence.
const publicProjectConfig = {
  apiKey: 'AIzaSyDyGYziRkgsdW-L8AzzTA0_hFnKEXjrc60',
  authDomain: 'lendit-9a759.firebaseapp.com',
  projectId: 'lendit-9a759',
  storageBucket: 'lendit-9a759.firebasestorage.app',
  messagingSenderId: '644382729603',
  appId: '1:644382729603:web:63e3ae5cf7955405afc2b6',
};

const cleanEnvValue = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized.replace(/^("|')|("|')$/g, '');
};

const configuredApiKey = cleanEnvValue(import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey:            /^AIza[\w-]+$/.test(configuredApiKey) ? configuredApiKey : publicProjectConfig.apiKey,
  authDomain:        cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || publicProjectConfig.authDomain,
  projectId:         cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID) || publicProjectConfig.projectId,
  storageBucket:     cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || publicProjectConfig.storageBucket,
  messagingSenderId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || publicProjectConfig.messagingSenderId,
  appId:             cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID) || publicProjectConfig.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
