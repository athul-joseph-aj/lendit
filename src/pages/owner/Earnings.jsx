// src/pages/owner/Earnings.jsx
// Route: /owner/earnings
// Shows total earnings, counts, and recent transactions computed from completed bookings.

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import Loading from '../../components/Loading';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Earnings() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedCount: 0,
    pendingCount: 0,
    transactions: [],
  });

  useEffect(() => {
    if (!currentUser) return;

    async function fetchEarnings() {
      try {
        const snap = await getDocs(
          query(collection(db, 'bookings'), where('ownerId', '==', currentUser.uid))
        );

        let totalEarnings = 0;
        let completedCount = 0;
        let pendingCount = 0;
        const completedBookings = [];

        snap.forEach((d) => {
          const data = d.data();
          if (data.status === 'completed') {
            completedCount++;
            totalEarnings += data.totalAmount || 0;
            completedBookings.push({ id: d.id, ...data });
          } else if (data.status === 'pending' || data.status === 'accepted') {
            pendingCount++;
          }
        });

        // Sort by date desc, take latest 10
        completedBookings.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        const recent = completedBookings.slice(0, 10);

        // Enrich with item names
        const transactions = await Promise.all(
          recent.map(async (booking) => {
            let itemName = booking.itemId;
            let renterName = booking.renterId;
            if (booking.itemId) {
              const itemSnap = await getDoc(doc(db, 'items', booking.itemId));
              if (itemSnap.exists()) itemName = itemSnap.data().name;
            }
            if (booking.renterId) {
              const renterSnap = await getDoc(doc(db, 'users', booking.renterId));
              if (renterSnap.exists()) renterName = renterSnap.data().name || renterSnap.data().email;
            }
            return { ...booking, itemName, renterName };
          })
        );

        setStats({ totalEarnings, completedCount, pendingCount, transactions });
      } catch (err) {
        console.error('Earnings fetch error:', err);
        setError('Failed to load earnings. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [currentUser]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center text-red-600">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: t('totalEarnings'),
      value: `₹${stats.totalEarnings.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: 'From completed rentals',
    },
    {
      label: t('completedRentals'),
      value: stats.completedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      desc: 'Rentals finished',
    },
    {
      label: t('pendingEarnings'),
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      desc: 'Pending / active',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('earnings')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your rental income from completed bookings.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-6">
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-0.5">{card.value}</p>
              <p className="text-sm font-medium text-gray-700">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Earnings summary */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-900">Earnings Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-xs text-primary-700 mb-1">Average per rental</p>
            <p className="text-xl font-bold text-primary">
              ₹{stats.completedCount > 0
                ? Math.round(stats.totalEarnings / stats.completedCount).toLocaleString()
                : 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-700 mb-1">Total completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completedCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-gray-900">{t('recentTransactions')}</h2>
        </div>

        {stats.transactions.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{t('noTransactions')}</p>
            <p className="text-gray-400 text-sm">{t('noEarnings')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{tx.itemName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(tx.createdAt)}
                    {tx.renterName && <> · {tx.renterName}</>}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">+₹{tx.totalAmount?.toLocaleString()}</p>
                  <span className="badge-done text-xs">{t('completed')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
