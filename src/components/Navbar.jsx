// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Package, Wrench, Search, PlusCircle, LayoutDashboard, ClipboardList, UserCircle, LogIn, LogOut } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Unable to log out:', error);
    }
  };

  const desktopLinks = [
    { name: t('home'), path: '/' },
    { name: t('rent'), path: '/rent' },
    { name: t('activity'), path: '/activity' },
    { name: t('services'), path: '/services' },
    { name: t('listItem'), path: '/list-item' },
    { name: t('ownerDashboard'), path: '/owner' },
  ];

  const mobileBottomLinks = [
    { name: t('home'), path: '/', icon: Search },
    { name: t('rent'), path: '/rent', icon: Package },
    { name: t('activity'), path: '/activity', icon: ClipboardList },
    { name: t('listItem'), path: '/list-item', icon: PlusCircle },
    { name: t('services'), path: '/services', icon: Wrench },
    { name: t('ownerDashboard'), path: '/owner', icon: LayoutDashboard },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop & Top Mobile Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="container-main flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" aria-label="lendit home">
            <Brand />
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
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors max-w-44"
                  title={currentUser.email || ''}
                >
                  <UserCircle className="w-5 h-5 shrink-0" />
                  <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  {t('login')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
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

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16 animate-fade-in">
          <div className="p-4 flex flex-col gap-4">
            {currentUser ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <UserCircle className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="flex items-center p-3 text-left text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut className="w-5 h-5 mr-3" />
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <LogIn className="w-5 h-5 mr-3 text-gray-400" />
                  {t('login')}
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-primary hover:bg-primary-50 rounded-lg font-medium">
                  <UserCircle className="w-5 h-5 mr-3" />
                  {t('signUp')}
                </Link>
              </>
            )}
            <Link to="/list-item" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg">
              <PlusCircle className="w-5 h-5 mr-3 text-gray-400" />
              {t('listItem')}
            </Link>
            <Link to="/owner" onClick={() => setMobileMenuOpen(false)} className="flex items-center p-3 text-primary hover:bg-primary-50 rounded-lg font-medium">
              <LayoutDashboard className="w-5 h-5 mr-3 text-primary" />
              {t('ownerDashboard')}
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar — hidden on owner pages which have their own tab bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe ${
        location.pathname.startsWith('/owner') ? 'hidden' : ''
      }`}>
        <div className="flex items-center justify-around h-16 px-2">
          {mobileBottomLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            
            return (
              <Link
                key={link.name}
                to={link.path}
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
