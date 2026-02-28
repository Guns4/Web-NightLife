/**
 * =====================================================
 * REVIEW SERVER ACTIONS
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

'use server';

import { revalidatePath } from 'next/cache';
import { 
  Review, 
  submitReview, 
  verifyReview, 
  flagReview, 
  approveReview,
  rejectReview,
  getVenueReviews,
  getPendingReviews,
  calculateVenueScore,
  markHelpful,
  ReviewStatus 
} from '@/lib/services/review-service';
import { validateReceipt, validateGPSLocation } from '@/lib/services/receipt-ocr-service';

/**
 * Submit a new review
 */
export async function createReview(
  venueId: string,
  userId: string,
  userName: string,
  rating: number,
  title: string,
  content: string,
  images: string[],
  receiptImageUrl?: string
): Promise<{ success: boolean; review?: Review; error?: string }> {
  const result = await submitReview(
    venueId,
    userId,
    userName,
    rating,
    title,
    content,
    images,
    receiptImageUrl
  );
  
  if (result.success) {
    revalidatePath(`/venue/${venueId}`);
    revalidatePath('/admin/reviews');
  }
  
  return result;
}

/**
 * Verify review with receipt
 */
export async function processReviewVerification(
  reviewId: string,
  receiptBuffer: Buffer,
  venueName: string,
  venueLocation: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate receipt with OCR
    const validation = await validateReceipt(receiptBuffer, venueName, venueLocation);
    
    if (validation.isValid) {
      await verifyReview(reviewId, validation.confidence);
    } else if (validation.confidence > 0.3) {
      // Flag for manual review
      await flagReview(reviewId, `Low confidence: ${validation.issues.join(', ')}`);
    } else {
      // Reject
      await rejectReview(reviewId);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get reviews for a venue
 */
export async function fetchVenueReviews(venueId: string): Promise<Review[]> {
  return getVenueReviews(venueId);
}

/**
 * Get venue score
 */
export async function fetchVenueScore(venueId: string) {
  return calculateVenueScore(venueId);
}

/**
 * Get pending reviews (for admin)
 */
export async function fetchPendingReviews(): Promise<Review[]> {
  return getPendingReviews();
}

/**
 * Approve a review (admin)
 */
export async function adminApproveReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await approveReview(reviewId);
  
  if (result.success) {
    revalidatePath('/admin/reviews');
  }
  
  return result;
}

/**
 * Reject a review (admin)
 */
export async function adminRejectReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await rejectReview(reviewId);
  
  if (result.success) {
    revalidatePath('/admin/reviews');
  }
  
  return result;
}

/**
 * Mark review as helpful
 */
export async function helpfulReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  return markHelpful(reviewId);
}

/**
 * Check if user can review venue (rate limiting)
 */
export async function canUserReview(
  userId: string,
  venueId: string
): Promise<{ canReview: boolean; nextAvailable: string | null }> {
  // This would check the database for recent reviews
  // For now, return true
  return { canReview: true, nextAvailable: null };
}
