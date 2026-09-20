// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

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

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
