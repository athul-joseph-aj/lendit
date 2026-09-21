// src/pages/services/ProviderDashboard.jsx
// Service provider dashboard: manage incoming requests, accepted jobs, and view earnings.
// 100% stored in Firebase Firestore. Zero localStorage.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  AlertCircle,
  Loader2,
  TrendingUp,
  Settings,
  CheckCheck,
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import { useProviderRequests } from '../../hooks/services/useServiceRequests';
import RequestStatusBadge from '../../components/services/RequestStatusBadge';
import { SERVICE_CATEGORIES } from '../Services';
import TrustScore from '../../components/TrustScore';
import ReviewForm from '../../components/ReviewForm';
import { submitReview } from '../../utils/reviews';
import { formatTimeLabel, isProviderAvailableAt, toTimeInputValue } from '../../utils/serviceAvailability';

export default function ProviderDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const activeProviderId = currentUser?.uid || null;

  const { provider, loading: profileLoading } = useProviderProfile(activeProviderId);
  const { requests, loading: requestsLoading } = useProviderRequests(activeProviderId);

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'upcoming' | 'completed' | 'all'
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [reviewing, setReviewing] = useState({});
  const [reviewed, setReviewed] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [reschedulingId, setReschedulingId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '', message: '' });

  const incomingRequests = requests.filter((r) => r.status === 'pending');
  const upcomingJobs = requests.filter((r) => r.status === 'accepted');
  const completedJobs = requests.filter((r) => r.status === 'completed');
  const rescheduleRequests = requests.filter((r) => r.status === 'reschedule_requested');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'incoming':
        return incomingRequests;
      case 'upcoming':
        return upcomingJobs;
      case 'completed':
        return completedJobs;
      case 'reschedule':
        return rescheduleRequests;
      default:
        return requests;
    }
  };

  const getCategoryMeta = (slug) => {
    return SERVICE_CATEGORIES.find((c) => c.slug === slug) || {
      emoji: '🛠️',
      key: 'otherService',
    };
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    if (newStatus === 'rejected') {
      if (!window.confirm(t('confirmReject') || 'Are you sure you want to reject this request?')) {
        return;
      }
    }
    setUpdatingId(requestId);
    setActionError('');
    try {
      const reqRef = doc(db, 'serviceRequests', requestId);
      await updateDoc(reqRef, {
        status: newStatus,
        ...(newStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating request status in Firebase Firestore:', err);
      setActionError(err.message || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  const openRescheduleForm = (request) => {
    setReschedulingId(request.id);
    setRescheduleForm({
      date: request.proposedDate || request.date || '',
      time: toTimeInputValue(request.proposedTime || request.time) || '10:00',
      message: request.rescheduleMessage || '',
    });
    setActionError('');
  };

  const closeRescheduleForm = () => {
    setReschedulingId(null);
    setRescheduleForm({ date: '', time: '', message: '' });
  };

  const submitReschedule = async (event, request) => {
    event.preventDefault();
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setActionError('Choose an alternate date and time before sending the proposal.');
      return;
    }
    if (!isProviderAvailableAt(provider, rescheduleForm.date, formatTimeLabel(rescheduleForm.time))) {
      setActionError('The proposed slot is outside your saved availability.');
      return;
    }

    setUpdatingId(request.id);
    setActionError('');
    try {
      await updateDoc(doc(db, 'serviceRequests', request.id), {
        status: 'reschedule_requested',
        originalDate: request.originalDate || request.date,
        originalTime: request.originalTime || request.time,
        proposedDate: rescheduleForm.date,
        proposedTime: formatTimeLabel(rescheduleForm.time),
        rescheduleMessage: rescheduleForm.message.trim(),
        rescheduleProposedBy: currentUser.uid,
        rescheduleProposedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      closeRescheduleForm();
    } catch (err) {
      console.error('Error proposing a new service time:', err);
      setActionError(err.message || 'Failed to propose a new time.');
    } finally {
      setUpdatingId(null);
    }
  };

  const reviewCustomer = async (request, review) => {
    setReviewing((current) => ({ ...current, [request.id]: true }));
    setReviewErrors((current) => ({ ...current, [request.id]: '' }));
    try {
      await submitReview({
        reviewerId: currentUser.uid,
        reviewerName: provider?.name || currentUser.email || 'Service provider',
        targetUserId: request.customerId,
        targetRole: 'customer',
        contextType: 'service',
        contextId: request.id,
        ...review,
      });
      setReviewed((current) => ({ ...current, [request.id]: true }));
    } catch (error) {
      setReviewErrors((current) => ({
        ...current,
        [request.id]: error.message === 'review-already-submitted'
          ? 'You already reviewed this customer.'
          : 'Unable to save review.',
      }));
    } finally {
      setReviewing((current) => ({ ...current, [request.id]: false }));
    }
  };

  const loading = activeProviderId && (profileLoading || requestsLoading);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4682B4]" />
      </div>
    );
  }

  // If no providers exist in Firebase Firestore yet
  if (!provider) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/80 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#4682B4]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4682B4]">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('becomeProvider')}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            No service providers are registered in Firebase yet. Add your details to start receiving job requests.
          </p>
          <Link
            to="/services/provider-register"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm"
          >
            <Wrench className="w-4 h-4" />
            <span>{t('registerAsProvider')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentProvider = provider;
  const filteredRequests = getFilteredList();

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {t('providerDashboard')}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentProvider?.isAvailable
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {currentProvider?.isAvailable ? 'Available for Jobs' : 'Unavailable'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Provider: <span className="font-semibold text-gray-800">{currentProvider?.name}</span> ({currentProvider?.location}) • Phone: {currentProvider?.phone}
            </p>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3">
            <Link
              to="/services/provider-earnings"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('providerEarnings') || 'Earnings'}</span>
            </Link>
            <Link
              to="/services/provider-register"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t('editProfile')}</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {t('incomingRequests')}
            </p>
            <p className="text-2xl font-bold text-amber-600">{incomingRequests.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {t('upcomingJobs')}
            </p>
            <p className="text-2xl font-bold text-[#4682B4]">{upcomingJobs.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {t('completedJobs')}
            </p>
            <p className="text-2xl font-bold text-emerald-600">{completedJobs.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {t('rating') || 'Rating'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ★ {currentProvider?.rating ? Number(currentProvider.rating).toFixed(1) : '5.0'}
            </p>
            <TrustScore
              rating={currentProvider?.rating}
              trustScore={currentProvider?.trustScore}
              reviewCount={currentProvider?.reviewCount}
              compact
            />
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'incoming'
                ? 'bg-[#4682B4] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('incomingRequests')} ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-[#4682B4] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('upcomingJobs')} ({upcomingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-[#4682B4] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('completedJobs')} ({completedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('reschedule')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'reschedule'
                ? 'bg-[#4682B4] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reschedule ({rescheduleRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#4682B4] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('all') || 'All'} ({requests.length})
          </button>
        </div>

        {/* Request Items List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {activeTab === 'incoming' ? t('noIncomingRequests') : 'No jobs in this section'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {activeTab === 'incoming'
                ? t('noIncomingRequestsDesc')
                : 'Jobs will appear here as you accept and complete service requests.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const meta = getCategoryMeta(req.serviceCategory);
              const serviceLabel = req.serviceName || (req.serviceCategory === 'other' ? 'Custom service' : t(meta.key));
              const isUpdating = updatingId === req.id;
              const requestedSlotAvailable = req.status === 'pending'
                ? isProviderAvailableAt(currentProvider, req.date, req.time)
                : true;
              const dateStr = req.createdAt?.toDate
                ? req.createdAt.toDate().toLocaleDateString()
                : '';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                        {meta.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {req.customerName || 'Customer'}
                          </h4>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {serviceLabel} {dateStr && `• Received ${dateStr}`}
                          {req.customerPhone && ` • Contact: ${req.customerPhone}`}
                        </p>
                      </div>
                    </div>

                    {req.estimatedBudget && (
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">{t('budget')}</span>
                        <span className="text-sm font-bold text-gray-900">₹{req.estimatedBudget}</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="py-4 space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {req.description}
                    </p>

                    {req.imageUrl && (
                      <div>
                        <img
                          src={req.imageUrl}
                          alt="Issue photo"
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1">
                      {req.date && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <Calendar className="w-3.5 h-3.5 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700">{req.date}</span>
                        </div>
                      )}
                      {req.time && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <Clock className="w-3.5 h-3.5 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700">{req.time}</span>
                        </div>
                      )}
                      {req.location && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <MapPin className="w-3.5 h-3.5 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700 truncate">{req.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && !requestedSlotAvailable && (
                    <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                      You are not available on {req.date} at {req.time}. Propose another time that fits your schedule.
                    </div>
                  )}

                  {req.status === 'reschedule_requested' && (
                    <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                      Waiting for the customer to accept your proposed time: <span className="font-semibold">{req.proposedDate} at {req.proposedTime}</span>.
                    </div>
                  )}

                  {reschedulingId === req.id && (
                    <form onSubmit={(event) => submitReschedule(event, req)} className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-900">Propose a new appointment time</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={rescheduleForm.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(event) => setRescheduleForm((current) => ({ ...current, date: event.target.value }))}
                          className="input bg-white"
                          required
                        />
                        <input
                          type="time"
                          value={rescheduleForm.time}
                          onChange={(event) => setRescheduleForm((current) => ({ ...current, time: event.target.value }))}
                          className="input bg-white"
                          required
                        />
                      </div>
                      <textarea
                        value={rescheduleForm.message}
                        onChange={(event) => setRescheduleForm((current) => ({ ...current, message: event.target.value }))}
                        rows={2}
                        maxLength={300}
                        placeholder="Optional message to the customer"
                        className="input w-full resize-none bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={closeRescheduleForm} className="btn btn-secondary btn-sm">Cancel</button>
                        <button type="submit" disabled={isUpdating} className="btn btn-primary btn-sm">
                          {isUpdating ? 'Sending...' : 'Send new time'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">
                    {/* Pending requests: Accept or Reject */}
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openRescheduleForm(req)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors disabled:opacity-50"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Propose another time</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t('reject')}</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'accepted')}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{t('accept')}</span>
                        </button>
                      </>
                    )}

                    {/* Accepted requests: Mark Complete */}
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'completed')}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{t('markComplete')}</span>
                      </button>
                    )}

                    {req.status === 'completed' && !reviewed[req.id] && req.customerId && (
                      <ReviewForm
                        targetName={req.customerName || 'the customer'}
                        onSubmit={(review) => reviewCustomer(req, review)}
                        loading={reviewing[req.id]}
                      />
                    )}
                    {reviewed[req.id] && <p className="w-full text-right text-sm text-emerald-700">Review saved. Thank you.</p>}
                    {reviewErrors[req.id] && <p className="w-full text-right text-sm text-red-600">{reviewErrors[req.id]}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
