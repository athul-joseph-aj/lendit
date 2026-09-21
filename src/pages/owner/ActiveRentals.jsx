// src/pages/owner/ActiveRentals.jsx
// Route: /owner/active
// Shows accepted bookings for this owner.
// Owner can mark a rental as completed.

import { useEffect, useState } from 'react';
import {
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getBookingContactRef } from '../../firebase/collections';
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
import ReviewForm from '../../components/ReviewForm';
import { submitReview } from '../../utils/reviews';
import { calculatePlatformFee, PLATFORM_FEE_DUE_DAYS } from '../../utils/rentalFinance';
import TrustScore from '../../components/TrustScore';
import { subscribeToOwnerBookings } from '../../utils/ownerBookings';

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
  const [reviewing, setReviewing] = useState({});
  const [reviewed, setReviewed] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});

  // Enrich booking with renter & item names
  const enrich = async (id, data) => {
    const [renterSnap, itemSnap, contactSnap] = await Promise.all([
      data.renterId ? getDoc(doc(db, 'users', data.renterId)) : Promise.resolve(null),
      data.itemId   ? getDoc(doc(db, 'items', data.itemId))   : Promise.resolve(null),
      ['accepted', 'completed'].includes(data.status)
        ? getDoc(getBookingContactRef(id))
        : Promise.resolve(null),
    ]);
    const renterProfile = renterSnap?.exists() ? renterSnap.data() : {};
    const privateContact = contactSnap?.exists() ? contactSnap.data() : {};
    return {
      id,
      ...data,
      renterName: renterProfile.name || renterProfile.displayName || renterProfile.email || data.renterName || data.renterEmail || t('renter'),
      renterRating: renterProfile.rating || 0,
      renterTrustScore: renterProfile.trustScore,
      renterReviewCount: renterProfile.reviewCount || 0,
      renterPhone: privateContact.renterPhone || '',
      itemName:   itemSnap?.exists()   ? itemSnap.data().name : data.itemId,
    };
  };

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToOwnerBookings(currentUser.uid, ['accepted', 'completed'], async (bookings) => {
      const enriched = await Promise.all(
        bookings.map((booking) => enrich(booking.id, booking))
      );
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
      const rental = rentals.find((entry) => entry.id === bookingId);
      const platformFee = calculatePlatformFee(rental?.totalAmount);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        platformFee,
        ownerPayout: Math.max(0, (rental?.totalAmount || 0) - platformFee),
        platformFeeRate: 0.05,
        platformFeePaid: false,
        platformFeePaymentStatus: 'unpaid',
        platformFeeDueAt: Timestamp.fromMillis(Timestamp.now().toMillis() + PLATFORM_FEE_DUE_DAYS * 24 * 60 * 60 * 1000),
      });
    } catch (err) {
      console.error('Mark completed error:', err);
    } finally {
      setCompleting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const reviewRenter = async (rental, review) => {
    setReviewing((current) => ({ ...current, [rental.id]: true }));
    setReviewErrors((current) => ({ ...current, [rental.id]: '' }));
    try {
      await submitReview({
        reviewerId: currentUser.uid,
        reviewerName: currentUser.displayName || currentUser.email || 'Lender',
        targetUserId: rental.renterId,
        targetRole: 'renter',
        contextType: 'rental',
        contextId: rental.id,
        ...review,
      });
      setReviewed((current) => ({ ...current, [rental.id]: true }));
    } catch (error) {
      setReviewErrors((current) => ({
        ...current,
        [rental.id]: error.message === 'review-already-submitted'
          ? 'You already reviewed this renter.'
          : 'Unable to save review.',
      }));
    } finally {
      setReviewing((current) => ({ ...current, [rental.id]: false }));
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
                    <TrustScore
                      rating={rental.renterRating}
                      trustScore={rental.renterTrustScore}
                      reviewCount={rental.renterReviewCount}
                      compact
                    />
                    {['accepted', 'completed'].includes(rental.status) && rental.renterPhone && (
                      <p className="text-xs text-emerald-700 mt-1">Phone: {rental.renterPhone}</p>
                    )}
                  </div>
                </div>

                <div className="ml-auto">
                  <span className={rental.status === 'completed' ? 'badge-done' : 'badge-active'}>
                    {rental.status === 'completed' ? t('completed') : t('accepted')}
                  </span>
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

              {rental.status === 'completed' && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-800">Platform fee (5%)</span>
                    <span className="font-semibold text-amber-900">₹{(rental.platformFee || calculatePlatformFee(rental.totalAmount)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-amber-800">Your payout</span>
                    <span className="font-bold text-emerald-700">₹{(rental.ownerPayout ?? ((rental.totalAmount || 0) - calculatePlatformFee(rental.totalAmount))).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {['accepted', 'completed'].includes(rental.status) && rental.renterPhone && (
                <p className="text-xs text-gray-500 mb-3">Renter phone is visible because you accepted this request.</p>
              )}

              {/* Mark complete button */}
              {rental.status === 'accepted' && (
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
                      {t('markCompleted')} — 5% platform fee recorded
                    </>
                  )}
                </button>
              )}

              {rental.status === 'completed' && !reviewed[rental.id] && (
                <ReviewForm
                  targetName={rental.renterName}
                  onSubmit={(review) => reviewRenter(rental, review)}
                  loading={reviewing[rental.id]}
                />
              )}
              {reviewed[rental.id] && <p className="mt-3 text-sm text-emerald-700">Review saved. Thank you.</p>}
              {reviewErrors[rental.id] && <p className="mt-2 text-sm text-red-600">{reviewErrors[rental.id]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
