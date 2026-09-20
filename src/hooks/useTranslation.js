// src/hooks/useTranslation.js
// Convenience hook — re-exports the translation function from LanguageContext.
// Usage: const { t, language, setLanguage } = useTranslation();

import { useLanguage } from '../context/LanguageContext';

export function useTranslation() {
  return useLanguage();
}
