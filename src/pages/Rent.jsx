// src/pages/Rent.jsx
import { Package } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/EmptyState';

export default function Rent() {
  const { t } = useTranslation();

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        {t('rent')}
      </h1>
      
      <div className="flex-1 flex items-center justify-center">
        <EmptyState 
          icon={Package}
          titleKey="comingSoon"
          descriptionKey="rentalPlaceholder"
          className="max-w-md w-full"
        />
      </div>
    </div>
  );
}
