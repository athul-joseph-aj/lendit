// src/hooks/services/useProviderProfile.js
// Real-time listener for a single service provider document.

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

/**
 * @param {string|null} providerId  - Firestore doc ID (= userId)
 * @returns {{ provider: Object|null, loading: boolean, error: string|null }}
 */
export function useProviderProfile(providerId) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!providerId) {
      setProvider(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'serviceProviders', providerId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProvider({ id: snap.id, ...snap.data() });
        } else {
          setProvider(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [providerId]);

  return { provider, loading, error };
}
