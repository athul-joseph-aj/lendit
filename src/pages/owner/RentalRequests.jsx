// src/pages/owner/RentalRequests.jsx
// Route: /owner/requests
// Shows pending bookings for this owner. Owner can Accept or Reject each request.

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
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

export default function RentalRequests() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { bookingId: true }

  // ── Fetch renter name + item name ────────────────────────
  const enrichBooking = async (bookingId, data) => {
    const [renterSnap, itemSnap] = await Promise.all([
      data.renterId ? getDoc(doc(db, 'users', data.renterId)) : Promise.resolve(null),
      data.itemId   ? getDoc(doc(db, 'items', data.itemId))   : Promise.resolve(null),
    ]);
    return {
      id: bookingId,
      ...data,
      renterName: renterSnap?.exists() ? renterSnap.data().name || renterSnap.data().email : data.renterId,
      itemName:   itemSnap?.exists()   ? itemSnap.data().name : data.itemName || data.itemId,
      itemLocation: itemSnap?.exists() ? itemSnap.data().location : data.itemLocation,
    };
  };

  // ── Real-time listener for pending bookings ──────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'bookings'),
      where('ownerId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const enriched = await Promise.all(
        snap.docs.map((d) => enrichBooking(d.id, d.data()))
      );
      enriched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(enriched);
      setLoading(false);
    }, (err) => {
      console.error('RentalRequests error:', err);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // ── Accept / Reject ──────────────────────────────────────
  const updateStatus = async (bookingId, status) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: status }));
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: null }));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('rentalRequests')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and respond to incoming rental requests.
        </p>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">{t('noRequests')}</p>
          <p className="text-gray-400 text-sm mt-1">New requests will appear here automatically.</p>
        </div>
      )}

      {/* Request cards */}
      <div className="space-y-4">
        {requests.map((req) => {
          const isAccepting = actionLoading[req.id] === 'accepted';
          const isRejecting = actionLoading[req.id] === 'rejected';
          const busy = isAccepting || isRejecting;

          return (
            <div key={req.id} className="card p-5 animate-fade-in">
              {/* Top row */}
              <div className="flex flex-wrap items-start gap-3 mb-4">
                {/* Renter */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{t('renter')}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{req.renterName}</p>
                  </div>
                </div>

                {/* Item */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Item</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{req.itemName}</p>
                    {req.itemLocation && (
                      <p className="text-xs text-gray-400 truncate">{req.itemLocation}</p>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="ml-auto">
                  <span className="badge-pending">{t('pending')}</span>
                </div>
              </div>

              {/* Date + amounts row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{t('startDate')}
                  </p>
                  <p className="font-medium text-gray-900">{formatDate(req.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{t('endDate')}
                  </p>
                  <p className="font-medium text-gray-900">{formatDate(req.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('rentalAmount')}</p>
                  <p className="font-bold text-primary">₹{req.totalAmount?.toLocaleString() || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('securityDeposit')}</p>
                  <p className="font-medium text-gray-900">₹{req.securityDeposit?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(req.id, 'rejected')}
                  disabled={busy}
                  className="flex-1 btn btn-secondary btn-md text-red-500 border-red-200 hover:bg-red-50"
                >
                  {isRejecting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><XCircle className="w-4 h-4" /> {t('reject')}</>
                  }
                </button>
                <button
                  onClick={() => updateStatus(req.id, 'accepted')}
                  disabled={busy}
                  className="flex-1 btn btn-primary btn-md"
                >
                  {isAccepting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle className="w-4 h-4" /> {t('accept')}</>
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
