// src/pages/services/ProviderEarnings.jsx
// Provider earnings overview: stats, completed jobs, and earnings breakdown.
// 100% stored and calculated from Firebase Firestore. Zero localStorage.

import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  IndianRupee,
  DollarSign,
  Calendar,
  User,
  Loader2,
  Wallet
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import { useServiceProviders } from '../../hooks/services/useServiceProviders';
import { useProviderRequests } from '../../hooks/services/useServiceRequests';
import { SERVICE_CATEGORIES } from '../Services';

export default function ProviderEarnings() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const { providers: allProviders, loading: allLoading } = useServiceProviders();
  const urlProviderId = searchParams.get('providerId');
  const activeProviderId = urlProviderId || (allProviders.length > 0 ? allProviders[0].id : null);

  const { provider, loading: profileLoading } = useProviderProfile(activeProviderId);
  const { requests, loading: requestsLoading } = useProviderRequests(activeProviderId);

  const loading = allLoading || (activeProviderId && (profileLoading || requestsLoading));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4682B4]" />
      </div>
    );
  }

  const currentProvider = provider || allProviders[0];
  const completedRequests = requests.filter((r) => r.status === 'completed');
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');

  // Calculate total earnings directly from Firestore completed records
  const totalEarnings = completedRequests.reduce((sum, req) => {
    const amount = Number(req.estimatedBudget) || Number(currentProvider?.startingPrice) || 0;
    return sum + amount;
  }, 0);

  const getCategoryMeta = (slug) => {
    return SERVICE_CATEGORIES.find((c) => c.slug === slug) || {
      emoji: '🛠️',
      key: 'otherService',
    };
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to={`/services/provider-dashboard?providerId=${currentProvider?.id || ''}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('providerDashboard')}
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('providerEarnings')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Earnings calculated live from completed jobs in Firebase Firestore for{' '}
            <span className="font-semibold text-gray-800">{currentProvider?.name || 'Provider'}</span>.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {/* Total Earnings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('totalEarnings')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              ₹{totalEarnings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              From {completedRequests.length} completed {completedRequests.length === 1 ? 'service' : 'services'}
            </p>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('completedJobs')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4682B4] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {completedRequests.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Successfully delivered
            </p>
          </div>

          {/* Pending / Active Jobs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('pendingJobs')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {pendingRequests.length + acceptedRequests.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {pendingRequests.length} pending • {acceptedRequests.length} in progress
            </p>
          </div>
        </div>

        {/* Completed Jobs History */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Earnings History (From Firebase Firestore)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Detailed ledger of all completed service jobs
            </p>
          </div>

          {completedRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">No completed jobs yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Jobs marked as completed in the Provider Dashboard will instantly appear here with their earnings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {completedRequests.map((req) => {
                const meta = getCategoryMeta(req.serviceCategory);
                const amount = Number(req.estimatedBudget) || Number(currentProvider?.startingPrice) || 0;
                const dateStr = req.date || (req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'N/A');

                return (
                  <div key={req.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                        {meta.emoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {t(meta.key)}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{req.customerName || 'Customer'}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-600">
                        +₹{amount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[11px] text-gray-400">Completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
