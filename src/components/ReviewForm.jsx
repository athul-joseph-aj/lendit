import { useState } from 'react';
import { Star, Send } from 'lucide-react';

export default function ReviewForm({ targetName, onSubmit, loading = false }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({ rating, comment });
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
      <p className="text-sm font-semibold text-gray-900">Review {targetName || 'this person'}</p>
      <div className="flex items-center gap-1" aria-label="Choose a rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            className="p-0.5"
          >
            <Star className={`w-5 h-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Share your experience (optional)"
        className="input w-full resize-none bg-white"
      />
      <button type="submit" disabled={loading} className="btn btn-primary btn-sm gap-2">
        <Send className="w-4 h-4" />
        {loading ? 'Saving...' : 'Submit review'}
      </button>
    </form>
  );
}
