// src/hooks/services/useServiceRequests.js
// Real-time listeners for service requests — completely stored and queried in Firebase Firestore.
// No localStorage required.

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Returns service requests from Firebase Firestore.
 * Optionally filters by customerId, phone, or name.
 * @param {string|null} filterTerm
 * @returns {{ requests: Array, loading: boolean, error: string|null }}
 */
export function useMyServiceRequests(filterTerm = null) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'serviceRequests');

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        let raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (filterTerm && filterTerm.trim()) {
          const term = filterTerm.trim().toLowerCase();
          raw = raw.filter(
            (r) =>
              (r.customerPhone && r.customerPhone.includes(term)) ||
              (r.customerId && r.customerId.toLowerCase() === term) ||
              (r.customerName && r.customerName.toLowerCase().includes(term))
          );
        }

        setRequests(sortByDateDesc(raw));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore serviceRequests error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [filterTerm]);

  return { requests, loading, error };
}

/**
 * Returns service requests received by a provider from Firebase Firestore.
 * @param {string|null} providerId
 * @returns {{ requests: Array, loading: boolean, error: string|null }}
 */
export function useProviderRequests(providerId = null) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'serviceRequests');

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        let raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (providerId) {
          raw = raw.filter((r) => r.providerId === providerId);
        }

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
