// src/hooks/services/useServiceProviders.js
// Real-time listener for the serviceProviders collection.
// Filtered safely client-side to avoid Firestore composite index requirements.

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

/**
 * @param {string|null} category  - service category slug (e.g. 'electrician'), or null for all
 * @param {string}      search    - freetext search (matched client-side on name/location)
 * @param {number}      minRating - minimum rating filter (0 = no filter)
 * @param {boolean}     onlyAvailable - if true, only return isAvailable === true providers
 * @returns {{ providers: Array, loading: boolean, error: string|null }}
 */
export function useServiceProviders(
  category = null,
  search = '',
  minRating = 0,
  onlyAvailable = false
) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    setLoading(true);

    const colRef = collection(db, 'serviceProviders');

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Category filter
        if (category) {
          results = results.filter((p) =>
            Array.isArray(p.services) ? p.services.includes(category) : false
          );
        }

        // Min rating filter
        if (minRating > 0) {
          results = results.filter((p) => (p.rating || 0) >= minRating);
        }

        // Availability filter
        if (onlyAvailable) {
          results = results.filter((p) => p.isAvailable === true);
        }

        // Search query filter (name, location, services)
        if (search.trim()) {
          const q2 = search.trim().toLowerCase();
          results = results.filter(
            (p) =>
              p.name?.toLowerCase().includes(q2) ||
              p.location?.toLowerCase().includes(q2) ||
              (Array.isArray(p.services) && p.services.some((s) => s.toLowerCase().includes(q2)))
          );
        }

        // Sort by rating descending, or newest
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setProviders(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore serviceProviders error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [category, search, minRating, onlyAvailable]);

  return { providers, loading, error };
}
