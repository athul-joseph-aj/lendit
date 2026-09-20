// src/pages/services/ProviderList.jsx
// Shows providers for a given service category with filtering.

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Search, Plus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useServiceProviders } from '../../hooks/services/useServiceProviders';
import { SERVICE_CATEGORIES } from '../Services';
import ServiceCategoryCard from '../../components/services/ServiceCategoryCard';
import ProviderCard from '../../components/services/ProviderCard';
import Loading from '../../components/Loading';

export default function ProviderList() {
  const { category } = useParams();
  const { t } = useTranslation();

  const [search, setSearch]           = useState('');
  const [minRating, setMinRating]     = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { providers, loading, error } = useServiceProviders(
    category,
    search,
    minRating,
    onlyAvailable
  );

  const catInfo = SERVICE_CATEGORIES.find((c) => c.slug === category);
  const categoryLabel = catInfo ? t(catInfo.key) : category;

  const ratingOptions = [
    { label: t('anyRating'),  value: 0   },
    { label: t('rating4plus'),  value: 4   },
    { label: t('rating45plus'), value: 4.5 },
  ];

  return (
    <div className="flex-1 bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="container-main py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link
              to="/services"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
              id="back-to-services"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('services')}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">
              {catInfo?.emoji} {categoryLabel}
            </span>
          </div>

          {/* Search + filters row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="provider-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input pl-9 py-2 text-sm"
              />
            </div>
            <button
              id="toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm gap-1.5 border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 animate-slide-up">
              {/* Rating filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">{t('filterByRating')}:</span>
                <div className="flex gap-1">
                  {ratingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMinRating(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        minRating === opt.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    onlyAvailable ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      onlyAvailable ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">{t('filterByAvailability')}</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Category pills (quick switch) ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-main py-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/services/${cat.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                  cat.slug === category
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:bg-primary-50'
                }`}
              >
                {cat.emoji} {t(cat.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="container-main py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loading />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{t('error')}</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {t('providersFound', { count: providers.length })}
            </p>

            {providers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm">
                <span className="text-5xl mb-3 block">{catInfo?.emoji ?? '🛠️'}</span>
                <p className="font-semibold text-gray-800 text-base mb-1">{t('noProvidersFound')}</p>
                <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">{t('noProvidersDesc')}</p>
                <Link
                  to="/services/provider-register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register as {catInfo ? t(catInfo.key) : 'Service'} Provider</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
