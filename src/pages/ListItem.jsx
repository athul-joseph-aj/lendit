// src/pages/ListItem.jsx
import { PlusCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/EmptyState';

export default function ListItem() {
  const { t } = useTranslation();

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        {t('listItem')}
      </h1>
      
      <div className="flex-1 flex items-center justify-center">
        <EmptyState 
          icon={PlusCircle}
          titleKey="comingSoon"
          descriptionKey="listItemPlaceholder"
          className="max-w-md w-full"
        />
      </div>
    </div>
  );
}
