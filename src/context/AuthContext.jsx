// Auth is disabled — a fixed owner identity is used for all Firestore operations.
// This lets you use the app without Firebase Authentication.

import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

// Fixed owner identity — all items will be saved under this ID
const OWNER_USER = {
  uid: 'owner-main',
  displayName: 'Owner',
  email: 'owner@lendit.app',
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const value = {
    currentUser: OWNER_USER,
    loading: false,
    login: () => Promise.resolve(),
    register: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
