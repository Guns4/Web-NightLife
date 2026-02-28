/**
 * =====================================================
 * REVIEW SERVICE - RATING ENGINE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

export type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected';
export type VerificationStatus = 'unverified' | 'verified' | 'pending_review';

export interface Review {
  id: string;
  venueId: string;
  userId: string;
  userName?: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  receiptImageUrl?: string;
  status: ReviewStatus;
  verificationStatus: VerificationStatus;
  verificationConfidence?: number;
  isVerified: boolean;
  weight: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithVenue extends Review {
  venueName: string;
  venueLocation: { lat: number; lng: number };
}

// Rating weights
const VERIFIED_WEIGHT = 3;
const UNVERIFIED_WEIGHT = 1;
const PENDING_WEIGHT = 0.5;

// Rate limiting
const RATE_LIMIT_WINDOW_HOURS = 12;
const MAX_REVIEWS_PER_USER_PER_VENUE = 1;

// In-memory store (replace with database)
const reviews: Map<string, Review> = new Map();
const userVenueReviews: Map<string, Review[]> = new Map();

/**
 * Submit a new review
 */
export async function submitReview(
  venueId: string,
  userId: string,
  userName: string,
  rating: number,
  title: string,
  content: string,
  images: string[],
  receiptImageUrl?: string
): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    // Check rate limit (1 review per user per venue per 12 hours)
    const rateLimitKey = `${userId}_${venueId}`;
    const existingReviews = userVenueReviews.get(rateLimitKey) || [];
    
    const twelveHoursAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentReview = existingReviews.find(r => new Date(r.createdAt) > twelveHoursAgo);
    
    if (recentReview) {
      return {
        success: false,
        error: `You can only submit 1 review per venue every ${RATE_LIMIT_WINDOW_HOURS} hours`,
      };
    }
    
    const now = new Date().toISOString();
    const review: Review = {
      id: uuidv4(),
      venueId,
      userId,
      userName,
      rating: Math.min(5, Math.max(1, rating)),
      title,
      content,
      images,
      receiptImageUrl,
      status: receiptImageUrl ? 'pending' : 'approved',
      verificationStatus: receiptImageUrl ? 'pending_review' : 'unverified',
      isVerified: false,
      weight: UNVERIFIED_WEIGHT,
      helpfulCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    reviews.set(review.id, review);
    
    // Track for rate limiting
    existingReviews.push(review);
    userVenueReviews.set(rateLimitKey, existingReviews);
    
    return { success: true, review };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Verify a review (after OCR validation)
 */
export async function verifyReview(
  reviewId: string,
  confidence: number
): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const review = reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    review.verificationStatus = 'verified';
    review.isVerified = true;
    review.weight = VERIFIED_WEIGHT;
    review.verificationConfidence = confidence;
    review.status = 'approved';
    review.updatedAt = new Date().toISOString();
    
    reviews.set(reviewId, review);
    
    return { success: true, review };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Flag a review for manual review
 */
export async function flagReview(
  reviewId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const review = reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    review.status = 'flagged';
    review.updatedAt = new Date().toISOString();
    
    reviews.set(reviewId, review);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Approve a flagged review
 */
export async function approveReview(reviewId: string): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const review = reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    review.status = 'approved';
    review.updatedAt = new Date().toISOString();
    
    reviews.set(reviewId, review);
    
    return { success: true, review };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Reject a review
 */
export async function rejectReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const review = reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    review.status = 'rejected';
    review.updatedAt = new Date().toISOString();
    
    reviews.set(reviewId, review);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get reviews for a venue
 */
export async function getVenueReviews(venueId: string): Promise<Review[]> {
  return Array.from(reviews.values())
    .filter(r => r.venueId === venueId && r.status === 'approved')
    .sort((a, b) => {
      // Verified reviews first, then by date
      if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/**
 * Get all pending reviews (for admin)
 */
export async function getPendingReviews(): Promise<Review[]> {
  return Array.from(reviews.values())
    .filter(r => r.status === 'pending' || r.status === 'flagged')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Calculate AfterHours Score for a venue
 * Weighted average: Verified reviews have 3x more weight
 */
export async function calculateVenueScore(venueId: string): Promise<{
  score: number;
  totalReviews: number;
  verifiedCount: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}> {
  const venueReviews = await getVenueReviews(venueId);
  
  if (venueReviews.length === 0) {
    return {
      score: 0,
      totalReviews: 0,
      verifiedCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  
  let weightedSum = 0;
  let totalWeight = 0;
  let verifiedCount = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  for (const review of venueReviews) {
    weightedSum += review.rating * review.weight;
    totalWeight += review.weight;
    distribution[review.rating as keyof typeof distribution]++;
    
    if (review.isVerified) {
      verifiedCount++;
    }
  }
  
  const score = weightedSum / totalWeight;
  
  return {
    score: Math.round(score * 10) / 10,
    totalReviews: venueReviews.length,
    verifiedCount,
    distribution,
  };
}

/**
 * Mark review as helpful
 */
export async function markHelpful(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const review = reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    review.helpfulCount++;
    reviews.set(reviewId, review);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
