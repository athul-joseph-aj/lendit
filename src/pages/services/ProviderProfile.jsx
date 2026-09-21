// src/pages/services/ProviderProfile.jsx
// Full provider profile with reviews section and Request Service button.

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, BadgeCheck,
  Phone, Calendar, ChevronRight, MessageCircle
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import StarRating from '../../components/services/StarRating';
import Loading from '../../components/Loading';
import TrustScore from '../../components/TrustScore';
import { getDocs, query, where } from 'firebase/firestore';
import { reviewsCol } from '../../firebase/collections';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ProviderProfile() {
  const { providerId } = useParams();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const { provider, loading, error } = useProviderProfile(providerId);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!providerId) return;
    getDocs(query(reviewsCol, where('targetUserId', '==', providerId)))
      .then((snapshot) => {
        const nextReviews = snapshot.docs
          .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setReviews(nextReviews);
      })
      .catch(() => setReviews([]));
  }, [providerId]);

  const handleRequestService = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/services/request/${providerId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="text-gray-500">{error || 'Provider not found'}</p>
        <Link to="/services" className="btn btn-secondary btn-sm">
          {t('services')}
        </Link>
      </div>
    );
  }

  const {
    name, services = [], customServiceName = '', experience = 0, rating = 0, reviewCount = 0, trustScore,
    location = '', startingPrice = 0, isAvailable = false,
    profileImage = '', about = '', phone = '',
    availability = [],
  } = provider;

  const primaryService = services[0] ?? 'other';
  const serviceKey = `${primaryService}Service`;
  const serviceLabel = services.includes('other') && customServiceName
    ? customServiceName
    : t(serviceKey);
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex-1 bg-gray-50 pb-24 md:pb-0">
      {/* ── Back nav ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-main py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
            id="back-to-providers"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('services')}
          </button>
        </div>
      </div>

      <div className="container-main py-6 max-w-3xl">
        {/* ── Profile card ── */}
        <div className="card p-6 mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0 flex sm:flex-col items-start gap-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary font-bold text-2xl">
                  {initials}
                </div>
              )}
              {isAvailable && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Available
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{name}</h1>
              <p className="text-primary font-semibold mb-2">{serviceLabel}</p>

              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={rating} size="md" />
                {reviewCount > 0 && (
                  <span className="text-sm text-gray-400">({reviewCount} {t('reviews')})</span>
                )}
              </div>
              <TrustScore rating={rating} trustScore={trustScore} reviewCount={reviewCount} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{t('yearsExperience', { years: experience })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{location}</span>
                </div>
                {startingPrice > 0 && (
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    <span>{t('fromPrice', { price: startingPrice })}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── About ── */}
        {about && (
          <div className="card p-5 mb-4 animate-fade-in">
            <h2 className="font-semibold text-gray-900 mb-2">{t('about')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{about}</p>
          </div>
        )}

        {/* ── Services offered ── */}
        {services.length > 0 && (
          <div className="card p-5 mb-4 animate-fade-in">
            <h2 className="font-semibold text-gray-900 mb-3">{t('servicesOffered')}</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-primary-50 text-primary text-sm font-medium rounded-full border border-primary-100"
                >
                  {s === 'other' && customServiceName ? customServiceName : t(`${s}Service`)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Availability ── */}
        {availability.length > 0 && (
          <div className="card p-5 mb-4 animate-fade-in">
            <h2 className="font-semibold text-gray-900 mb-3">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {t('availability')}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {DAY_KEYS.map((dayKey) => {
                const dayShort = t(dayKey);
                const isOpen = availability.includes(dayShort) || availability.includes(dayKey);
                return (
                  <span
                    key={dayKey}
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                      isOpen
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    {dayShort}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Reviews placeholder ── */}
        <div className="card p-5 mb-4 animate-fade-in">
          <h2 className="font-semibold text-gray-900 mb-3">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              {t('reviews')} {reviewCount > 0 && `(${reviewCount})`}
            </span>
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noReviews')}</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-500">{review.reviewerName || 'LendIt user'}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sticky CTA (mobile bottom bar equivalent) ── */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg md:static md:shadow-none md:border-0 md:p-0 md:mt-2 z-30">
          <button
            id="request-service-btn"
            onClick={handleRequestService}
            className="btn btn-primary btn-lg w-full md:max-w-xs"
          >
            {t('requestService')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
