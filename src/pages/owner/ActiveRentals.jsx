// src/pages/owner/ActiveRentals.jsx
// Route: /owner/active
// Shows accepted bookings for this owner.
// Owner can mark a rental as completed.

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Truck,
  CheckCircle,
  Calendar,
  User,
  Package,
  Loader2,
} from 'lucide-react';
import Loading from '../../components/Loading';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActiveRentals() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState({});

  // Enrich booking with renter & item names
  const enrich = async (id, data) => {
    const [renterSnap, itemSnap] = await Promise.all([
      data.renterId ? getDoc(doc(db, 'users', data.renterId)) : Promise.resolve(null),
      data.itemId   ? getDoc(doc(db, 'items', data.itemId))   : Promise.resolve(null),
    ]);
    const renterProfile = renterSnap?.exists() ? renterSnap.data() : {};
    return {
      id,
      ...data,
      renterName: renterProfile.name || renterProfile.displayName || renterProfile.email || data.renterName || data.renterEmail || t('renter'),
      itemName:   itemSnap?.exists()   ? itemSnap.data().name : data.itemId,
    };
  };

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'bookings'),
      where('ownerId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const enriched = await Promise.all(snap.docs.map((d) => enrich(d.id, d.data())));
      enriched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRentals(enriched);
      setLoading(false);
    }, (err) => {
      console.error('ActiveRentals error:', err);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const markCompleted = async (bookingId) => {
    setCompleting((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        completedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Mark completed error:', err);
    } finally {
      setCompleting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('activeRentals')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your ongoing rentals. Mark them complete when the item is returned.
        </p>
      </div>

      {/* Empty state */}
      {rentals.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Truck className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">{t('noActiveRentals')}</p>
          <p className="text-gray-400 text-sm mt-1">Accepted rentals will appear here.</p>
        </div>
      )}

      {/* Rental cards */}
      <div className="space-y-4">
        {rentals.map((rental) => {
          const busy = completing[rental.id];

          return (
            <div key={rental.id} className="card p-5 animate-fade-in border-l-4 border-l-indigo-400">
              {/* Top row */}
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Item</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{rental.itemName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{t('renter')}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{rental.renterName}</p>
                  </div>
                </div>

                <div className="ml-auto">
                  <span className="badge-active">{t('accepted')}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{t('startDate')}
                  </p>
                  <p className="font-medium text-gray-900">{formatDate(rental.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{t('endDate')}
                  </p>
                  <p className="font-medium text-gray-900">{formatDate(rental.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('rentalAmount')}</p>
                  <p className="font-bold text-primary">₹{rental.totalAmount?.toLocaleString() || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('securityDeposit')}</p>
                  <p className="font-medium text-gray-900">₹{rental.securityDeposit?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {/* Mark complete button */}
              <button
                onClick={() => markCompleted(rental.id)}
                disabled={busy}
                className="w-full btn btn-md bg-green-500 hover:bg-green-600 text-white gap-2"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t('markCompleted')}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
