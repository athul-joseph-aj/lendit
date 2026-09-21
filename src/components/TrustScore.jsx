import { ShieldCheck } from 'lucide-react';
import StarRating from './services/StarRating';

export default function TrustScore({ rating = 0, trustScore, reviewCount = 0, compact = false }) {
  const score = trustScore ?? Math.round((Number(rating) || 0) * 20);

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <ShieldCheck className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600`} />
      <span className="font-semibold text-emerald-700">Trust score {score}/100</span>
      {!compact && <StarRating rating={rating} />}
      {reviewCount > 0 && <span className="text-gray-400">({reviewCount} reviews)</span>}
    </div>
  );
}
