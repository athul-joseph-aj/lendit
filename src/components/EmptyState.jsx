// src/components/EmptyState.jsx
import { PackageOpen } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  titleKey = 'emptyState',
  descriptionKey,
  actionKey,
  onAction,
  className = '',
}) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 ${className}`}>
      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-400">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{t(titleKey)}</h3>
      {descriptionKey && (
        <p className="text-gray-500 max-w-sm mb-6">{t(descriptionKey)}</p>
      )}
      {actionKey && onAction && (
        <Button onClick={onAction} variant="secondary">
          {t(actionKey)}
        </Button>
      )}
    </div>
  );
}
