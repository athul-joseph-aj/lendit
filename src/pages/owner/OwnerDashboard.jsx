// src/pages/owner/OwnerDashboard.jsx
// Route: /owner
// Shows summary stats for the authenticated owner pulled live from Firestore.

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import {
  Package,
  ClipboardList,
  Truck,
  CheckCircle,
  DollarSign,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import Loading from '../../components/Loading';
import { calculatePlatformFee } from '../../utils/rentalFinance';
import { getOwnerBookings } from '../../utils/ownerBookings';
import PlatformFeePayment from '../../components/PlatformFeePayment';

export default function OwnerDashboard() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    async function fetchStats() {
      try {
        const uid = currentUser.uid;

        // Fetch all owner items count
        const itemsSnap = await getDocs(
          query(collection(db, 'items'), where('ownerId', '==', uid))
        );

        // Fetch all owner bookings
        const ownerBookings = await getOwnerBookings(uid);

        let pending = 0, active = 0, completed = 0, totalEarnings = 0, unpaidPlatformFees = 0;
        const feeBookings = [];
        ownerBookings.forEach((d) => {
          if (d.status === 'pending')   pending++;
          if (d.status === 'accepted')  active++;
          if (d.status === 'completed') {
            completed++;
            const grossAmount = Number(d.totalAmount) || 0;
            const fee = Number(d.platformFee) || calculatePlatformFee(grossAmount);
            totalEarnings += Number(d.ownerPayout) || Math.max(0, grossAmount - fee);
            if (!d.platformFeePaid && d.platformFeePaymentStatus !== 'paid') {
              unpaidPlatformFees += fee;
              feeBookings.push({ ...d, platformFee: fee });
            }
          }
        });

        setStats({
          totalListings: itemsSnap.size,
          pending,
          active,
          completed,
          totalEarnings,
          unpaidPlatformFees,
          feeBookings,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [currentUser]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card p-8 text-center text-red-600">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const CARDS = [
    {
      label: t('totalListings'),
      value: stats.totalListings,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/owner/listings',
    },
    {
      label: t('pendingRequests'),
      value: stats.pending,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/owner/requests',
    },
    {
      label: t('activeRentals'),
      value: stats.active,
      icon: Truck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/owner/active',
    },
    {
      label: t('completedRentals'),
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/owner/earnings',
    },
    {
      label: t('totalEarnings'),
      value: `₹${stats.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/owner/earnings',
      wide: true,
    },
  ];

  const markFeePaid = (bookingId) => {
    setStats((current) => {
      const fee = current.feeBookings.find((booking) => booking.id === bookingId)?.platformFee || 0;
      return {
        ...current,
        feeBookings: current.feeBookings.map((booking) => (
          booking.id === bookingId
            ? { ...booking, platformFeePaid: true, platformFeePaymentStatus: 'paid' }
            : booking
        )),
        unpaidPlatformFees: Math.max(0, current.unpaidPlatformFees - fee),
      };
    });

    window.setTimeout(() => {
      setStats((current) => ({
        ...current,
        feeBookings: current.feeBookings.filter((booking) => booking.id !== bookingId),
      }));
    }, 1800);
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('ownerDashboard')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t('welcomeBack')}, {currentUser?.displayName || ''}
          </p>
        </div>
        <Link
          to="/list-item"
          className="btn btn-primary btn-md gap-2 hidden sm:inline-flex"
        >
          <PlusCircle className="w-4 h-4" />
          {t('addItem')}
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.filter((c) => !c.wide).map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-primary transition-colors">
                {card.label}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          );
        })}
      </div>

      {/* Earnings wide card */}
      {CARDS.filter((c) => c.wide).map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            to={card.href}
            className="card p-6 flex items-center gap-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group mb-8"
          >
            <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5">{card.value}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        );
      })}

      {stats.feeBookings.length > 0 && (
        <section className="card p-5 mb-8 border-amber-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Platform fee payment</h2>
              <p className="text-sm text-gray-500">Pay the fee due for your completed rentals.</p>
            </div>
            <p className="text-xl font-bold text-amber-700">₹{stats.unpaidPlatformFees.toLocaleString()}</p>
          </div>
          <div className="space-y-3">
            {stats.feeBookings.map((booking) => (
              <PlatformFeePayment
                key={booking.id}
                bookingId={booking.id}
                amount={booking.platformFee}
                booking={booking}
                onPaid={markFeePaid}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/list-item"
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
              {t('addItem')}
            </p>
            <p className="text-xs text-gray-400">List a new item for rent</p>
          </div>
        </Link>
        <Link
          to="/owner/requests"
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
              {t('rentalRequests')}
            </p>
            <p className="text-xs text-gray-400">
              {stats.pending} {t('pendingRequests').toLowerCase()}
            </p>
          </div>
        </Link>
        <Link
          to="/owner/active"
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
              {t('activeRentals')}
            </p>
            <p className="text-xs text-gray-400">
              {stats.active} ongoing
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
