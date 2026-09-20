// src/pages/Services.jsx
// Services home: category grid + live search + featured providers + quick actions
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Wrench, LayoutGrid, Sparkles, UserCheck, Plus } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import ServiceCategoryCard from '../components/services/ServiceCategoryCard';
import ProviderCard from '../components/services/ProviderCard';
import { useServiceProviders } from '../hooks/services/useServiceProviders';

// ── Service categories ────────────────────────────────────────────────────────
export const SERVICE_CATEGORIES = [
  { slug: 'electrician',      emoji: '🔧', key: 'electricianService'     },
  { slug: 'plumber',          emoji: '🚰', key: 'plumberService'          },
  { slug: 'carpenter',        emoji: '🪚', key: 'carpenterService'        },
  { slug: 'acRepair',         emoji: '❄️', key: 'acRepairService'         },
  { slug: 'applianceRepair',  emoji: '🔌', key: 'applianceRepairService'  },
  { slug: 'cleaning',         emoji: '🧹', key: 'cleaningService'         },
  { slug: 'painting',         emoji: '🎨', key: 'paintingService'         },
  { slug: 'moving',           emoji: '🚚', key: 'movingService'           },
  { slug: 'other',            emoji: '🛠️', key: 'otherService'            },
];

export default function Services() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  // Only fetch when user has typed something
  const isSearching = searchQuery.trim().length > 1 || locationQuery.trim().length > 1;
  const combinedSearch = [searchQuery, locationQuery].filter(Boolean).join(' ');

  // Live providers from Firestore
  const { providers, loading } = useServiceProviders(null, isSearching ? combinedSearch : '', 0, false);

  const handleCategoryClick = (slug) => {
    navigate(`/services/${slug}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen pb-20 md:pb-0">

      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-main py-10 md:py-14">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-[#4682B4]/10 text-[#4682B4] text-xs font-semibold px-3 py-1.5 rounded-full">
                <Wrench className="w-3.5 h-3.5" />
                LendIt Services
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                <Sparkles className="w-3 h-3" />
                No Login Required
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              {t('findTrustedServices')}
            </h1>
            <p className="text-gray-500 text-base md:text-lg mb-8">
              {t('getHelpNearby')} Book reliable local professionals directly.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="service-search-input"
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="relative sm:w-56">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="service-location-input"
                  type="text"
                  placeholder={t('searchByLocation')}
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Results ── */}
      {isSearching && (
        <section className="container-main py-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {loading
                ? t('loading')
                : t('providersFound', { count: providers.length })}
            </h2>
          </div>

          {!loading && providers.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">{t('noProvidersFound')}</p>
              <p className="text-sm mt-1">{t('noProvidersDesc')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Category Grid ── */}
      {!isSearching && (
        <section className="container-main py-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-900 text-lg">{t('categories')}</h2>
            </div>
            <Link
              to="/services/provider-register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4682B4] hover:text-[#3b6f9a]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your Service</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <ServiceCategoryCard
                key={cat.slug}
                emoji={cat.emoji}
                label={t(cat.key)}
                slug={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Available Service Providers ── */}
      {!isSearching && (
        <section className="container-main py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#4682B4]" />
              <h2 className="font-bold text-gray-900 text-lg">Verified Local Service Providers</h2>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {providers.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {providers.slice(0, 8).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Provider Registration Banner ── */}
      {!isSearching && (
        <section className="container-main py-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 mb-1 text-base">{t('becomeProvider')}</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Are you an electrician, plumber, cleaner, or technician? Register your service in 2 minutes.
              </p>
            </div>
            <Link
              to="/services/provider-register"
              id="become-provider-cta"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm flex-shrink-0"
            >
              <span>{t('registerAsProvider')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Quick Links: My Requests & Provider Dashboard ── */}
      {!isSearching && (
        <section className="container-main py-2 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/services/my-requests"
              id="goto-my-requests"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#4682B4]/40 hover:shadow-sm transition-all group"
            >
              <div>
                <span className="font-semibold text-gray-900 text-sm group-hover:text-[#4682B4] transition-colors block">
                  {t('myRequests')}
                </span>
                <span className="text-xs text-gray-400">Track and manage your booked services</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4682B4] transition-colors" />
            </Link>

            <Link
              to="/services/provider-dashboard"
              id="goto-provider-dashboard"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#4682B4]/40 hover:shadow-sm transition-all group"
            >
              <div>
                <span className="font-semibold text-gray-900 text-sm group-hover:text-[#4682B4] transition-colors block">
                  {t('providerDashboard')}
                </span>
                <span className="text-xs text-gray-400">View incoming jobs & client requests</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4682B4] transition-colors" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
