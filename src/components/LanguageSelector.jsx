// src/components/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function LanguageSelector({ variant = 'navbar' }) {
  const { language, setLanguage, LANGUAGES } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  if (variant === 'profile') {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between p-4 rounded-xl border ${
              language === lang.code
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary/50'
            } transition-colors text-left`}
          >
            <div>
              <p className={`font-medium ${language === lang.code ? 'text-primary' : 'text-gray-900'}`}>
                {lang.nativeLabel}
              </p>
              <p className="text-sm text-gray-500">{lang.label}</p>
            </div>
            {language === lang.code && <Check className="w-5 h-5 text-primary" />}
          </button>
        ))}
      </div>
    );
  }

  // Navbar variant (dropdown)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline-block">
          {currentLang.nativeLabel}
        </span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-modal border border-gray-100 py-1 z-50 animate-fade-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                language === lang.code
                  ? 'bg-primary-50 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{lang.nativeLabel} <span className="text-gray-400 text-xs ml-1">({lang.label})</span></span>
              {language === lang.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
