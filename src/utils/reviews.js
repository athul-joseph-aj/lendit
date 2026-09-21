import {
  addDoc,
  doc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { reviewsCol } from '../firebase/collections';

const clampRating = (rating) => Math.min(5, Math.max(1, Number(rating) || 1));

export const trustScoreFromRating = (rating) => Math.round((Number(rating) || 0) * 20);

export async function submitReview({
  reviewerId,
  reviewerName = '',
  targetUserId,
  targetRole,
  rating,
  comment = '',
  contextType,
  contextId,
}) {
  if (!reviewerId || !targetUserId || reviewerId === targetUserId) {
    throw new Error('invalid-review-target');
  }

  const existingSnapshot = await getDocs(
    query(reviewsCol, where('reviewerId', '==', reviewerId))
  );
  const hasExistingReview = existingSnapshot.docs.some((reviewDoc) => {
    const review = reviewDoc.data();
    return review.targetUserId === targetUserId && review.contextId === contextId;
  });

  if (hasExistingReview) throw new Error('review-already-submitted');

  await addDoc(reviewsCol, {
    reviewerId,
    reviewerName,
    targetUserId,
    targetRole,
    rating: clampRating(rating),
    comment: String(comment || '').trim(),
    contextType,
    contextId,
    createdAt: serverTimestamp(),
  });

  const targetReviewsSnapshot = await getDocs(
    query(reviewsCol, where('targetUserId', '==', targetUserId))
  );
  const ratings = targetReviewsSnapshot.docs
    .map((reviewDoc) => Number(reviewDoc.data().rating) || 0)
    .filter(Boolean);
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
    : 0;
  const trustScore = trustScoreFromRating(averageRating);
  const profileRef = targetRole === 'serviceProvider'
    ? doc(db, 'serviceProviders', targetUserId)
    : doc(db, 'users', targetUserId);

  await setDoc(profileRef, {
    rating: averageRating,
    reviewCount: ratings.length,
    trustScore,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { averageRating, reviewCount: ratings.length, trustScore };
}
