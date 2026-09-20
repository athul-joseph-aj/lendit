// src/pages/services/ProviderDashboard.jsx
// Service provider dashboard: manage incoming requests, accepted jobs, and view earnings.
// 100% stored in Firebase Firestore. Zero localStorage.

import { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  User,
  AlertCircle,
  Loader2,
  TrendingUp,
  Settings,
  ArrowRight,
  Phone,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useTranslation } from '../../hooks/useTranslation';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import { useServiceProviders } from '../../hooks/services/useServiceProviders';
import { useProviderRequests } from '../../hooks/services/useServiceRequests';
import RequestStatusBadge from '../../components/services/RequestStatusBadge';
import { SERVICE_CATEGORIES } from '../Services';

export default function ProviderDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load all providers directly from Firebase Firestore
  const { providers: allProviders, loading: allProvidersLoading } = useServiceProviders();

  // Provider ID: from URL search params, or default to first provider in Firestore
  const urlProviderId = searchParams.get('providerId');
  const activeProviderId = urlProviderId || (allProviders.length > 0 ? allProviders[0].id : null);

  const { provider, loading: profileLoading } = useProviderProfile(activeProviderId);
  const { requests, loading: requestsLoading, error } = useProviderRequests(activeProviderId);

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'upcoming' | 'completed' | 'all'
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const incomingRequests = requests.filter((r) => r.status === 'pending');
  const upcomingJobs = requests.filter((r) => r.status === 'accepted');
  const completedJobs = requests.filter((r) => r.status === 'completed');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'incoming':
        return incomingRequests;
      case 'upcoming':
        return upcomingJobs;
      case 'completed':
        return completedJobs;
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

  const handleProviderSelect = (newId) => {
    setSearchParams({ providerId: newId });
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
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating request status in Firebase Firestore:', err);
      setActionError(err.message || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  const loading = allProvidersLoading || (activeProviderId && (profileLoading || requestsLoading));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4682B4]" />
      </div>
    );
  }

  // If no providers exist in Firebase Firestore yet
  if (!provider && allProviders.length === 0) {
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

  const currentProvider = provider || allProviders[0];
  const filteredRequests = getFilteredList();

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Switcher Bar: Provider Identity in Firebase */}
        {allProviders.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Viewing Provider:
              </span>
              <select
                value={currentProvider?.id || ''}
                onChange={(e) => handleProviderSelect(e.target.value)}
                className="text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4682B4]"
              >
                {allProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location}) - {p.services?.join(', ')}
                  </option>
                ))}
              </select>
            </div>

            <Link
              to="/services/provider-register"
              className="text-xs font-semibold text-[#4682B4] hover:underline"
            >
              + Register Another Provider
            </Link>
          </div>
        )}

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
              to={`/services/provider-earnings?providerId=${currentProvider?.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('providerEarnings') || 'Earnings'}</span>
            </Link>
            <Link
              to={`/services/provider-register?providerId=${currentProvider?.id}`}
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
              const isUpdating = updatingId === req.id;
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
                          {t(meta.key)} {dateStr && `• Received ${dateStr}`}
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

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">
                    {/* Pending requests: Accept or Reject */}
                    {req.status === 'pending' && (
                      <>
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
