// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Package, Wrench, Search, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const desktopLinks = [
    { name: t('home'), path: '/' },
    { name: t('rent'), path: '/rent' },
    { name: t('services'), path: '/services' },
    { name: t('listItem'), path: '/list-item' },
  ];

  const mobileBottomLinks = [
    { name: t('home'), path: '/', icon: Search },
    { name: t('rent'), path: '/rent', icon: Package },
    { name: t('services'), path: '/services', icon: Wrench },
    { name: t('activity'), path: '/activity', icon: PlusCircle },
    { name: t('profile'), path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop & Top Mobile Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="container-main flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              L
            </div>
            LendIt
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {desktopLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            
            {currentUser ? (
              <Link to="/profile" className="flex items-center gap-2 btn btn-ghost btn-sm rounded-full pl-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center overflow-hidden">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <span className="max-w-[100px] truncate">{currentUser.displayName || t('profile')}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm">{t('login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('signUp')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle (Only visible on mobile top bar) */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Menu (Optional extra links) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16 animate-fade-in">
          <div className="p-4 flex flex-col gap-4">
            {!currentUser && (
              <div className="flex flex-col gap-2 pb-4 border-b border-gray-100">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary w-full">
                  {t('login')}
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full">
                  {t('signUp')}
                </Link>
              </div>
            )}
            
            <Link to="/list-item" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg">
              <PlusCircle className="w-5 h-5 mr-3 text-gray-400" />
              {t('listItem')}
            </Link>
            <Link to="/activity" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg">
              <Package className="w-5 h-5 mr-3 text-gray-400" />
              {t('activity')}
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileBottomLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            
            // For profile, handle unauthenticated users
            const path = (link.path === '/profile' && !currentUser) ? '/login' : link.path;
            
            return (
              <Link
                key={link.name}
                to={path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  active ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'fill-primary/20' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
