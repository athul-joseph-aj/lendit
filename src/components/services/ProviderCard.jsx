// src/components/services/ProviderCard.jsx
// Card shown in the provider list and search results.

import { Link } from 'react-router-dom';
import { MapPin, Clock, BadgeCheck } from 'lucide-react';
import StarRating from './StarRating';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * @param {Object} provider  - Firestore provider document
 */
export default function ProviderCard({ provider }) {
  const { t } = useTranslation();

  const {
    id,
    name,
    services = [],
    customServiceName = '',
    experience = 0,
    rating = 0,
    reviewCount = 0,
    location = '',
    startingPrice = 0,
    isAvailable = false,
    profileImage = '',
    about = '',
  } = provider;

  // Human-readable category label from translation key
  const primaryService = services[0] ?? 'other';
  const serviceKey = `${primaryService}Service`;
  const serviceLabel = services.includes('other') && customServiceName
    ? customServiceName
    : t(serviceKey);

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="card flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profileImage ? (
            <img
              src={profileImage}
              alt={name}
              className="w-14 h-14 rounded-xl object-cover border border-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary font-bold text-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            {isAvailable && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400" title="Available" />
            )}
          </div>
          <p className="text-sm text-primary font-medium mb-1">{serviceLabel}</p>
          <StarRating rating={rating} />
          {reviewCount > 0 && (
            <span className="text-xs text-gray-400 ml-1">({reviewCount})</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-5 pb-4 flex flex-col gap-1.5 flex-1">
        {about && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{about}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span>{t('yearsExperience', { years: experience })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">{location}</span>
        </div>
        {startingPrice > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium mt-1">
            <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span>{t('fromPrice', { price: startingPrice })}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          to={`/services/provider/${id}`}
          className="btn btn-secondary btn-sm w-full"
          id={`view-provider-${id}`}
        >
          {t('viewProfile')}
        </Link>
      </div>
    </div>
  );
}
