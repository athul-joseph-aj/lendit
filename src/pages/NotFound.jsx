// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-9xl font-bold text-primary opacity-10 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        {t('notFound')}
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        {t('notFoundDesc')}
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        <Home className="w-5 h-5 mr-2" />
        {t('goHome')}
      </Link>
    </div>
  );
}
