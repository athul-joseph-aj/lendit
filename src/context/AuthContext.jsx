// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { getUserRef } from '../firebase/collections';

const AuthContext = createContext(null);
export const CURRENT_AGREEMENT_VERSION = '1.0';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementLoading, setAgreementLoading] = useState(true);

  const syncUserProfile = async (user) => {
    try {
      await setDoc(getUserRef(user.uid), {
        name: user.displayName || user.email?.split('@')[0] || 'LendIt user',
        email: user.email || '',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      // Authentication should still work if the optional profile document is
      // blocked by Firestore rules or temporarily unavailable.
      console.error('Unable to sync user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (!user) {
        setAgreementAccepted(false);
        setAgreementLoading(false);
        return;
      }

      setAgreementLoading(true);
      void Promise.all([syncUserProfile(user), getDoc(getUserRef(user.uid))])
        .then(([, profileSnap]) => {
          const profile = profileSnap.exists() ? profileSnap.data() : {};
          setAgreementAccepted(
            profile.agreementAccepted === true
            && profile.agreementVersion === CURRENT_AGREEMENT_VERSION
          );
        })
        .catch((error) => {
          console.error('Unable to load marketplace agreement:', error);
          setAgreementAccepted(false);
        })
        .finally(() => setAgreementLoading(false));
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, displayName = '') => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const trimmedName = displayName.trim();

    if (trimmedName) {
      await updateProfile(credential.user, { displayName: trimmedName });
    }

    await syncUserProfile(credential.user);

    return credential;
  };

  const googleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const acceptAgreement = async () => {
    if (!auth.currentUser) return;
    await setDoc(getUserRef(auth.currentUser.uid), {
      agreementAccepted: true,
      agreementVersion: CURRENT_AGREEMENT_VERSION,
      agreementAcceptedAt: serverTimestamp(),
    }, { merge: true });
    setAgreementAccepted(true);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    googleLogin,
    logout,
    agreementAccepted,
    agreementLoading,
    acceptAgreement,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
