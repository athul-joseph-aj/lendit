// src/pages/owner/OwnerLayout.jsx
// Shared layout for all /owner/* routes.
// Desktop: fixed left sidebar + scrollable main content.
// Mobile:  compact header + sticky bottom tab bar.

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ClipboardList,
  Truck,
  DollarSign,
  ChevronLeft,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const NAV_ITEMS = [
  { key: 'ownerDashboard', path: '/owner',           icon: LayoutDashboard, end: true },
  { key: 'addItem',        path: '/list-item',       icon: PlusCircle      },
  { key: 'myListings',     path: '/owner/listings',  icon: Package         },
  { key: 'rentalRequests', path: '/owner/requests',  icon: ClipboardList   },
  { key: 'activeRentals',  path: '/owner/active',    icon: Truck           },
  { key: 'earnings',       path: '/owner/earnings',  icon: DollarSign      },
];

export default function OwnerLayout({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-16">
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {t('ownerSection')}
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ key, path, icon: Icon, end }) => (
            <NavLink
              key={key}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {t(key)}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Back to main site */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top breadcrumb bar */}
        <div className="md:hidden sticky top-16 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-800">{t('ownerSection')}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(({ key, path, icon: Icon, end }) => (
            <NavLink
              key={key}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'fill-primary/10' : ''}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[9px] font-medium leading-none">{t(key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
