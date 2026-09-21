// src/pages/Activity.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Calendar, Clock, CheckCircle, XCircle,
  FileSearch, MapPin, AlertCircle, Bell, BellRing, BellOff
} from 'lucide-react';
import {
  collectionGroup, getDocs, query, where, doc, getDoc, updateDoc,
  onSnapshot, runTransaction, serverTimestamp
} from 'firebase/firestore';
import {
  bookingsCol,
  itemRequestsCol,
  getBookingRef,
  getItemRequestRef,
  getItemRequestOffersCol,
} from '../firebase/collections';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import Button from '../components/Button';
import ProblemReportModal, { canReportProblem, getProblemEventDate } from '../components/ProblemReportModal';

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
  const [requestOffers, setRequestOffers] = useState({});
  const [providerOffers, setProviderOffers] = useState([]);
  const [providerOffersLoading, setProviderOffersLoading] = useState(true);
  const [offerActionId, setOfferActionId] = useState(null);
  const [offerError, setOfferError] = useState('');
  const [reminderLoading, setReminderLoading] = useState({});
  const [dueReminders, setDueReminders] = useState([]);
  const [reminderError, setReminderError] = useState(false);
  const [problemTransaction, setProblemTransaction] = useState(null);

  // ── Fetch bookings ──────────────────────────────────────
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        setBookingsError(false);
        const bookingsQuery = currentUser
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
          if (!data.itemId) continue;

          let itemData = null;
          try {
            const itemSnap = await getDoc(doc(db, 'items', data.itemId));
            if (itemSnap.exists()) itemData = itemSnap.data();
          } catch {}

          // Bookings can outlive their item when an owner removes a listing or
          // the database is reset. Do not render those orphaned records as
          // "Unknown item" cards; only show requests for current listings.
          if (!itemData) continue;

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

  // ── Return reminders ────────────────────────────────────
  const getDateValue = (dateValue) => {
    if (!dateValue) return null;
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const canHaveReturnReminder = (booking) =>
    ['accepted', 'active'].includes(booking.status) && Boolean(getDateValue(booking.endDate));

  useEffect(() => {
    const checkDueReminders = () => {
      const due = bookings.filter((booking) => {
        const endDate = getDateValue(booking.endDate);
        return booking.returnReminderEnabled
          && canHaveReturnReminder(booking)
          && endDate
          && endDate <= new Date();
      });

      setDueReminders(due);

      if (!due.length || typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const notificationKey = 'lendit-return-reminders-shown';
      let shownReminders = [];
      try {
        shownReminders = JSON.parse(window.localStorage.getItem(notificationKey) || '[]');
      } catch {
        shownReminders = [];
      }

      const newlyDue = due.filter((booking) => !shownReminders.includes(booking.id));
      newlyDue.forEach((booking) => {
        try {
          new Notification(t('returnReminderTitle'), {
            body: `${booking.item?.name || booking.itemName || t('unknownItem')}: ${t('returnReminderBody')}`,
          });
        } catch (error) {
          console.error('Unable to show return reminder notification:', error);
        }
      });

      if (newlyDue.length) {
        window.localStorage.setItem(
          notificationKey,
          JSON.stringify([...shownReminders, ...newlyDue.map((booking) => booking.id)])
        );
      }
    };

    checkDueReminders();
    const intervalId = window.setInterval(checkDueReminders, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [bookings, t]);

  const toggleReturnReminder = async (booking) => {
    const enabled = !booking.returnReminderEnabled;
    setReminderLoading((current) => ({ ...current, [booking.id]: true }));
    setReminderError(false);

    try {
      if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') await Notification.requestPermission();
      }

      await updateDoc(getBookingRef(booking.id), {
        returnReminderEnabled: enabled,
        returnReminderAt: enabled ? booking.endDate : null,
        reminderUpdatedAt: serverTimestamp(),
      });

      setBookings((current) => current.map((currentBooking) => (
        currentBooking.id === booking.id
          ? { ...currentBooking, returnReminderEnabled: enabled, returnReminderAt: enabled ? booking.endDate : null }
          : currentBooking
      )));
    } catch (error) {
      console.error('Unable to update return reminder:', error);
      setReminderError(true);
    } finally {
      setReminderLoading((current) => ({ ...current, [booking.id]: false }));
    }
  };

  // ── Fetch item requests ─────────────────────────────────
  useEffect(() => {
    const fetchItemRequests = async () => {
      try {
        setLoadingRequests(true);
        setRequestsError(false);
        const requestsQuery = currentUser
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

  // Listen for offers on the signed-in user's requests so the requester can
  // review providers without exposing those offers to other users.
  useEffect(() => {
    if (!itemRequests.length) {
      setRequestOffers({});
      return undefined;
    }

    const unsubscribers = itemRequests.map((request) => (
      onSnapshot(
        getItemRequestOffersCol(request.id),
        (snapshot) => {
          const offers = snapshot.docs
            .map((offerDoc) => ({ id: offerDoc.id, ...offerDoc.data() }))
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setRequestOffers((current) => ({ ...current, [request.id]: offers }));
        },
        (error) => {
          console.error(`Error loading offers for request ${request.id}:`, error);
        }
      )
    ));

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [itemRequests]);

  // A provider can track every offer they submitted, including offers on
  // requests that are no longer public after a match.
  useEffect(() => {
    if (!currentUser) {
      setProviderOffers([]);
      setProviderOffersLoading(false);
      return undefined;
    }

    setProviderOffersLoading(true);
    const providerOffersQuery = query(
      collectionGroup(db, 'offers'),
      where('providerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      providerOffersQuery,
      async (snapshot) => {
        const offers = await Promise.all(snapshot.docs.map(async (offerDoc) => {
          const requestRef = offerDoc.ref.parent.parent;
          const requestSnap = requestRef ? await getDoc(requestRef) : null;
          return {
            id: offerDoc.id,
            requestId: requestRef?.id,
            ...offerDoc.data(),
            request: requestSnap?.exists() ? { id: requestSnap.id, ...requestSnap.data() } : null,
          };
        }));
        offers.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setProviderOffers(offers);
        setProviderOffersLoading(false);
      },
      (error) => {
        console.error('Error loading provider offers:', error);
        setProviderOffers([]);
        setProviderOffersLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const acceptProviderOffer = async (request, offer) => {
    if (!currentUser || currentUser.uid !== request.requesterId) {
      setOfferError(t('onlyRequesterCanAccept'));
      return;
    }

    setOfferActionId(offer.id);
    setOfferError('');

    try {
      const offersSnapshot = await getDocs(getItemRequestOffersCol(request.id));

      await runTransaction(db, async (transaction) => {
        const requestRef = getItemRequestRef(request.id);
        const selectedOfferRef = doc(getItemRequestOffersCol(request.id), offer.id);
        const [requestSnapshot, selectedOfferSnapshot] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(selectedOfferRef),
        ]);

        if (!requestSnapshot.exists() || requestSnapshot.data().requesterId !== currentUser.uid) {
          throw new Error('not-request-owner');
        }
        if (requestSnapshot.data().status !== 'open') {
          throw new Error('request-already-matched');
        }
        if (!selectedOfferSnapshot.exists() || selectedOfferSnapshot.data().status !== 'pending') {
          throw new Error('offer-no-longer-available');
        }

        transaction.update(requestRef, {
          status: 'matched',
          selectedProviderId: selectedOfferSnapshot.data().providerId,
          selectedOfferId: offer.id,
          matchedAt: serverTimestamp(),
        });
        transaction.update(selectedOfferRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });

        offersSnapshot.docs.forEach((offerDoc) => {
          if (offerDoc.id !== offer.id && offerDoc.data().status === 'pending') {
            transaction.update(offerDoc.ref, {
              status: 'rejected',
              rejectedAt: serverTimestamp(),
            });
          }
        });
      });
    } catch (error) {
      console.error('Error accepting provider offer:', error);
      const messageKey = {
        'not-request-owner': 'onlyRequesterCanAccept',
        'request-already-matched': 'requestAlreadyMatched',
        'offer-no-longer-available': 'offerNoLongerAvailable',
      }[error.message];
      setOfferError(`${t(messageKey || 'requestError')} (${error.code || error.message})`);
    } finally {
      setOfferActionId(null);
    }
  };

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
      case 'matched':   return { label: t('statusMatched'),   color: 'bg-indigo-100 text-indigo-800',         icon: CheckCircle };
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

      {dueReminders.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <h2 className="font-semibold text-amber-900">{t('returnReminderTitle')}</h2>
              <p className="text-sm text-amber-800 mt-1">
                {dueReminders.map((booking) => booking.item?.name || booking.itemName || t('unknownItem')).join(', ')} — {t('returnReminderBody')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {reminderError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {t('reminderError')}
        </div>
      )}

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

      {offerError && activeTab === 'itemRequests' && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {offerError}
        </div>
      )}

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
                      {canHaveReturnReminder(booking) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          isLoading={reminderLoading[booking.id]}
                          onClick={() => toggleReturnReminder(booking)}
                        >
                          {booking.returnReminderEnabled ? (
                            <BellOff className="w-4 h-4 mr-2" />
                          ) : (
                            <Bell className="w-4 h-4 mr-2" />
                          )}
                          {booking.returnReminderEnabled ? t('disableReturnReminder') : t('setReturnReminder')}
                        </Button>
                      )}
                      {getProblemEventDate(booking, 'rental') && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setProblemTransaction(booking)}
                        >
                          {canReportProblem(booking, 'rental') ? 'Raise a Problem' : 'Problem window closed'}
                        </Button>
                      )}
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
              const offers = requestOffers[req.id] || [];
              const selectedOffer = offers.find((offer) => offer.id === req.selectedOfferId);
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

                  {req.status === 'matched' && (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{t('matchedProvider')}</p>
                      <p className="font-semibold text-gray-900">
                        {selectedOffer?.providerName || req.selectedProviderId || t('provider')}
                      </p>
                      {selectedOffer?.providerPhone && <p className="text-sm text-gray-600">{t('phone')}: {selectedOffer.providerPhone}</p>}
                      {selectedOffer?.providerEmail && <p className="text-sm text-gray-600">{t('email')}: {selectedOffer.providerEmail}</p>}
                      {selectedOffer?.message && <p className="text-sm text-gray-600">{selectedOffer.message}</p>}
                      {selectedOffer?.price != null && <p className="text-sm font-semibold text-gray-900">{t('price')}: ₹{selectedOffer.price}</p>}
                    </div>
                  )}

                  {req.status === 'open' && (
                    <div className="border-t border-gray-100 pt-3 mt-1 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">{t('availableProviders')}</h4>
                      {offers.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('noProviderOffers')}</p>
                      ) : (
                        offers.map((offer) => (
                          <div key={offer.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900">{offer.providerName || t('provider')}</p>
                              <span className={`badge ${offer.status === 'accepted' ? 'badge-done' : offer.status === 'rejected' ? 'badge-canceled' : 'badge-pending'}`}>
                                {offer.status === 'pending' ? t('statusPending') : offer.status === 'accepted' ? t('statusAccepted') : t('notSelected')}
                              </span>
                            </div>
                            {offer.message && <p className="text-sm text-gray-600">{offer.message}</p>}
                            {offer.price != null && <p className="text-sm font-semibold text-gray-900">{t('price')}: ₹{offer.price}</p>}
                            {offer.status === 'pending' && (
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="w-full"
                                isLoading={offerActionId === offer.id}
                                onClick={() => acceptProviderOffer(req, offer)}
                              >
                                {t('acceptProvider')}
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
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

      {activeTab === 'itemRequests' && !providerOffersLoading && providerOffers.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t('myProviderOffers')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('myProviderOffersDesc')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providerOffers.map((offer) => (
              <Card key={`${offer.requestId}-${offer.id}`} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{offer.request?.category || t('otherCategory')}</p>
                    <h3 className="font-semibold text-gray-900">{offer.request?.itemName || t('itemName')}</h3>
                  </div>
                  <span className={`badge ${offer.status === 'accepted' ? 'badge-done' : offer.status === 'rejected' ? 'badge-canceled' : 'badge-pending'}`}>
                    {offer.status === 'accepted' ? t('statusAccepted') : offer.status === 'rejected' ? t('notSelected') : t('statusPending')}
                  </span>
                </div>
                {offer.request?.location && <p className="text-sm text-gray-600"><MapPin className="inline w-4 h-4 mr-1 text-gray-400" />{offer.request.location}</p>}
                {offer.message && <p className="text-sm text-gray-600">{offer.message}</p>}
                {offer.price != null && <p className="text-sm font-semibold text-gray-900">{t('price')}: ₹{offer.price}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      <ProblemReportModal
        isOpen={Boolean(problemTransaction)}
        onClose={() => setProblemTransaction(null)}
        transaction={problemTransaction}
        transactionType="rental"
      />
    </div>
  );
}
