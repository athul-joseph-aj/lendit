// src/pages/Activity.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Calendar, Clock, CheckCircle, XCircle,
  FileSearch, MapPin, AlertCircle
} from 'lucide-react';
import { getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { bookingsCol, itemRequestsCol } from '../firebase/collections';
import { db } from '../firebase/firebase';
import { DEMO_MODE } from '../config/demo';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import Button from '../components/Button';

export default function Activity() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' | 'itemRequests'
  const [bookings, setBookings] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [bookingsError, setBookingsError] = useState(false);
  const [requestsError, setRequestsError] = useState(false);

  // ── Fetch bookings ──────────────────────────────────────
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        setBookingsError(false);
        const bookingsQuery = DEMO_MODE
          ? bookingsCol
          : currentUser
            ? query(bookingsCol, where('renterId', '==', currentUser.uid))
            : null;

        if (!bookingsQuery) {
          setBookings([]);
          return;
        }

        const snapshot = await getDocs(bookingsQuery);

        const list = [];
        for (const bookingDoc of snapshot.docs) {
          const data = bookingDoc.data();
          let itemData = null;
          try {
            const itemSnap = await getDoc(doc(db, 'items', data.itemId));
            if (itemSnap.exists()) itemData = itemSnap.data();
          } catch {}
          list.push({ id: bookingDoc.id, ...data, item: itemData });
        }

        list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setBookings(list);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setBookingsError(true);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [currentUser]);

  // ── Fetch item requests ─────────────────────────────────
  useEffect(() => {
    const fetchItemRequests = async () => {
      try {
        setLoadingRequests(true);
        setRequestsError(false);
        const requestsQuery = DEMO_MODE
          ? itemRequestsCol
          : currentUser
            ? query(itemRequestsCol, where('requesterId', '==', currentUser.uid))
            : null;

        if (!requestsQuery) {
          setItemRequests([]);
          return;
        }

        const snapshot = await getDocs(requestsQuery);
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setItemRequests(list);
      } catch (err) {
        console.error('Error fetching item requests:', err);
        setRequestsError(true);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchItemRequests();
  }, [currentUser]);

  // ── Booking status config ────────────────────────────────
  const getBookingStatusConfig = (status) => {
    switch (status) {
      case 'pending':   return { label: t('statusPending'),   color: 'badge-pending',                         icon: Clock };
      case 'accepted':  return { label: t('statusAccepted'),  color: 'bg-indigo-100 text-indigo-800',         icon: CheckCircle };
      case 'active':    return { label: t('statusActive'),    color: 'badge-active',                          icon: CheckCircle };
      case 'completed':
      case 'done':      return { label: t('statusDone'),      color: 'badge-done',                            icon: CheckCircle };
      case 'rejected':  return { label: t('statusRejected'),  color: 'bg-red-100 text-red-800',               icon: XCircle };
      case 'cancelled':
      case 'canceled':  return { label: t('statusCanceled'),  color: 'badge-canceled',                        icon: XCircle };
      default:          return { label: status,               color: 'bg-gray-100 text-gray-800',             icon: Package };
    }
  };

  // ── Item request status config ────────────────────────────
  const getRequestStatusConfig = (status) => {
    switch (status) {
      case 'open':      return { label: t('statusOpen'),      color: 'badge-active',                          icon: AlertCircle };
      case 'fulfilled': return { label: t('statusFulfilled'), color: 'badge-done',                            icon: CheckCircle };
      case 'cancelled': return { label: t('statusCanceled'),  color: 'badge-canceled',                        icon: XCircle };
      default:          return { label: status,               color: 'bg-gray-100 text-gray-800',             icon: Package };
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return t('notAvailable');
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return d.toLocaleDateString();
  };

  const tabs = [
    { id: 'rentals',      label: t('myBookings'),       count: bookings.length },
    { id: 'itemRequests', label: t('myItemRequests'),   count: itemRequests.length },
  ];

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      {/* Tab header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('activity')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── My Rentals Tab ── */}
      {activeTab === 'rentals' && (
        loadingBookings ? (
          <Loading />
        ) : bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const sc = getBookingStatusConfig(booking.status);
              const Icon = sc.icon;
              return (
                <Card key={booking.id} padding="p-0" className="overflow-hidden flex flex-col">
                  <div className="h-32 bg-gray-100 relative overflow-hidden">
                    {booking.item?.images?.[0] ? (
                      <img
                        src={booking.item.images[0]}
                        alt={booking.item?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`badge ${sc.color} flex items-center shadow-sm`}>
                        <Icon className="w-3.5 h-3.5 mr-1" />
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">
                      {booking.item?.name || t('unknownItem')}
                    </h3>

                    <div className="flex flex-col gap-2 mt-auto text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDate(booking.startDate)} &mdash; {formatDate(booking.endDate)}</span>
                      </div>
                      {(booking.pickupOption || booking.preference) && (
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="capitalize">{booking.pickupOption || booking.preference}</span>
                        </div>
                      )}
                      {booking.item?.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{booking.item.location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                        <span className="text-gray-500">{t('totalAmount')}</span>
                        <span className="font-bold text-gray-900">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            <EmptyState
              icon={Package}
              titleKey="emptyState"
              descriptionKey={bookingsError ? 'firebaseError' : 'activityPlaceholder'}
              className="max-w-md w-full"
            />
            <Link to="/rent">
              <Button variant="primary">{t('exploreRentals')}</Button>
            </Link>
          </div>
        )
      )}

      {/* ── My Item Requests Tab ── */}
      {activeTab === 'itemRequests' && (
        loadingRequests ? (
          <Loading />
        ) : itemRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemRequests.map((req) => {
              const sc = getRequestStatusConfig(req.status);
              const Icon = sc.icon;
              return (
                <Card key={req.id} className="flex flex-col gap-3">
                  {/* Item name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                        {req.category}
                      </p>
                      <h3 className="font-semibold text-gray-900 leading-tight">{req.itemName}</h3>
                    </div>
                    <span className={`badge ${sc.color} flex items-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {sc.label}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                  )}

                  <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                    {req.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        <span>{req.location}</span>
                      </div>
                    )}
                    {(req.startDate || req.endDate) && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        <span>{formatDate(req.startDate)} &mdash; {formatDate(req.endDate)}</span>
                      </div>
                    )}
                    {req.budget && (
                      <div className="flex items-center pt-3 mt-1 border-t border-gray-100">
                        <span className="text-gray-500 mr-2">{t('budget')}:</span>
                        <span className="font-semibold text-gray-900">{req.budget}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FileSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('myItemRequests')}</h2>
              <p className="text-gray-500 mb-5">{requestsError || bookingsError ? t('firebaseError') : t('communityDesc')}</p>
              <Link to="/rent">
                <Button variant="primary">{t('requestAnItem')}</Button>
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}
