// src/components/Loading.jsx
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function Loading({ fullScreen = false, messageKey = 'loading' }) {
  const { t } = useTranslation();

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-gray-500 font-medium">{t(messageKey)}</p>
    </div>
  );
}
