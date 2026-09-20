// src/context/LanguageContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import en from '../locales/en.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import kn from '../locales/kn.json';

const LOCALES = { en, ml, hi, ta, kn };

export const LANGUAGES = [
  { code: 'en', label: 'English',    nativeLabel: 'English'    },
  { code: 'ml', label: 'Malayalam',  nativeLabel: 'മലയാളം'     },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिन्दी'        },
  { code: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்'       },
  { code: 'kn', label: 'Kannada',    nativeLabel: 'ಕನ್ನಡ'       },
];

const LanguageContext = createContext(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

/**
 * LanguageProvider — provides t(key) translation function and language switcher.
 * Selected language is persisted in localStorage.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('lendit_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lendit_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (LOCALES[code]) {
      setLanguageState(code);
    }
  }, []);

  /**
   * Translate a key to the current language.
   * Falls back to English, then returns the key itself if not found.
   * Supports template strings: t('hello', { name: 'World' }) → 'Hello, World!'
   *
   * @param {string} key
   * @param {Record<string, string>} [vars]
   * @returns {string}
   */
  const t = useCallback((key, vars = {}) => {
    const locale = LOCALES[language] || LOCALES.en;
    let text = locale[key] ?? LOCALES.en[key] ?? key;

    // Replace {{variable}} placeholders
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, v);
    });

    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
