import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Card from './Card';
import Button from './Button';

export default function RentalItemCard({ item, categoryLabel }) {
  const { t } = useTranslation();
  const priceUnitKey = item.priceUnit === 'hour'
    ? 'perHour'
    : item.priceUnit === 'week'
      ? 'perWeek'
      : 'perDay';

  return (
    <Card hover padding="p-0" className="h-full flex flex-col overflow-hidden group">
      <Link to={`/rent/${item.id}`} className="block h-48 w-full bg-gray-100 relative overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {t('noImage')}
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center text-xs font-semibold text-gray-900 shadow-sm">
          <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" />
          {item.rating ?? '—'}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`badge shadow-sm ${item.availability ? 'badge-active' : 'badge-canceled'}`}>
            {item.availability ? t('available') : t('currentlyUnavailable')}
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
          {categoryLabel || item.category}
        </div>
        <Link to={`/rent/${item.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">{item.name}</h3>
        </Link>
        <div className="flex items-center text-sm text-gray-500 mt-auto mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{item.location || '—'}</span>
        </div>
        <div className="flex items-baseline mb-4">
          <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
          <span className="text-sm text-gray-500 ml-1">/ {t(priceUnitKey)}</span>
        </div>
        <Link to={`/rent/${item.id}`}>
          <Button variant="secondary" size="sm" className="w-full">
            {t('viewDetails')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
