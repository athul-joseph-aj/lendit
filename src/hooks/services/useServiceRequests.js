// src/hooks/services/useServiceRequests.js
// Real-time listeners for service requests — sorted safely client-side.

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Returns all service requests made BY the current customer.
 * @param {string|null} customerId
 * @returns {{ requests: Array, loading: boolean, error: string|null }}
 */
export function useMyServiceRequests(customerId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!customerId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', customerId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(sortByDateDesc(raw));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore customer requests error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [customerId]);

  return { requests, loading, error };
}

/**
 * Returns all service requests received BY the provider.
 * @param {string|null} providerId
 * @returns {{ requests: Array, loading: boolean, error: string|null }}
 */
export function useProviderRequests(providerId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!providerId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'serviceRequests'),
      where('providerId', '==', providerId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(sortByDateDesc(raw));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore provider requests error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [providerId]);

  return { requests, loading, error };
}
