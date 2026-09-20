// src/pages/services/MyRequests.jsx
// Customer view of all their service requests.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Wrench,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Ban,
  ExternalLink,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useMyServiceRequests } from '../../hooks/services/useServiceRequests';
import { getActiveUserId } from '../../utils/userSession';
import RequestStatusBadge from '../../components/services/RequestStatusBadge';
import { SERVICE_CATEGORIES } from '../Services';

const TABS = [
  { id: 'all', labelKey: 'all' },
  { id: 'pending', labelKey: 'pending' },
  { id: 'accepted', labelKey: 'accepted' },
  { id: 'completed', labelKey: 'completed' },
  { id: 'cancelled', labelKey: 'cancelled' },
  { id: 'rejected', labelKey: 'rejected' },
];

export default function MyRequests() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const customerId = getActiveUserId(currentUser);
  const { requests, loading, error } = useMyServiceRequests(customerId);

  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  const getCategoryMeta = (slug) => {
    return SERVICE_CATEGORIES.find((c) => c.slug === slug) || {
      emoji: '🛠️',
      key: 'otherService',
    };
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm(t('confirmCancel') || 'Are you sure you want to cancel this request?')) {
      return;
    }
    setCancellingId(requestId);
    setCancelError('');
    try {
      const reqRef = doc(db, 'serviceRequests', requestId);
      await updateDoc(reqRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Error cancelling request:', err);
      setCancelError(err.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/services"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('services')}
            </Link>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-colors shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            {t('bookService') || 'Book a Service'}
          </Link>
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('myRequests')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('trackServiceRequests') || 'Track and manage your requested home & local services'}
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {TABS.map((tab) => {
            const count = tab.id === 'all'
              ? requests.length
              : requests.filter((r) => r.status === tab.id).length;

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#4682B4] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{t(tab.labelKey) || tab.id}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {(error || cancelError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || cancelError}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#4682B4] mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('loading') || 'Loading requests...'}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {t('noRequests')}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              {t('noRequestsDesc')}
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm"
            >
              <Wrench className="w-4 h-4" />
              {t('exploreServices') || 'Explore Services'}
            </Link>
          </div>
        )}

        {/* Request cards list */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const meta = getCategoryMeta(req.serviceCategory);
              const isCancellable = req.status === 'pending' || req.status === 'accepted';
              const createdDate = req.createdAt?.toDate
                ? req.createdAt.toDate().toLocaleDateString()
                : '';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                        {meta.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {t(meta.key)}
                          </h3>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        {createdDate && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t('requestedOn') || 'Requested on'} {createdDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {req.providerId && (
                      <Link
                        to={`/services/provider/${req.providerId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#4682B4] hover:text-[#3b6f9a] transition-colors"
                      >
                        <span>{t('viewProvider') || 'Provider details'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="py-4 space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {req.description}
                    </p>

                    {req.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={req.imageUrl}
                          alt="Problem photo"
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-gray-600">
                      {req.date && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <Calendar className="w-4 h-4 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700">{req.date}</span>
                        </div>
                      )}
                      {req.time && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <Clock className="w-4 h-4 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700">{req.time}</span>
                        </div>
                      )}
                      {req.location && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <MapPin className="w-4 h-4 text-[#4682B4] flex-shrink-0" />
                          <span className="font-medium text-gray-700 truncate">{req.location}</span>
                        </div>
                      )}
                    </div>

                    {req.estimatedBudget && (
                      <div className="text-xs text-gray-500 pt-1">
                        <span className="font-medium text-gray-700">
                          {t('budget') || 'Estimated Budget'}:
                        </span>{' '}
                        ₹{req.estimatedBudget}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  {isCancellable && (
                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === req.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('cancelling') || 'Cancelling...'}</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>{t('cancelRequest') || 'Cancel Request'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
