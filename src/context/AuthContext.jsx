// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { DEMO_MODE } from '../config/demo';

const AuthContext = createContext(null);

/**
 * Custom hook to access auth context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/**
 * AuthProvider — wraps the entire app.
 * Exposes: currentUser, loading, login, register, logout
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track Firebase auth state. In demo mode, create a silent anonymous
  // session so Firestore rules that require request.auth still allow requests.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user && DEMO_MODE) {
        try {
          await signInAnonymously(auth);
          return;
        } catch (err) {
          // The app can still run with the local demo identity when anonymous
          // sign-in is disabled in Firebase.
          console.warn('Anonymous demo sign-in unavailable:', err.message);
        }
      }

      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Register a new user with email/password.
   * Also creates a Firestore user document.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  async function register(name, email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Set display name on Firebase Auth profile
    await updateProfile(user, { displayName: name });

    // Create Firestore user document
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phone: '',
      profileImage: '',
      location: '',
      language: 'en',
      roles: ['customer'],
      createdAt: serverTimestamp(),
    });

    return credential;
  }

  /**
   * Login an existing user.
   * @param {string} email
   * @param {string} password
   */
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Logout the current user.
   */
  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
