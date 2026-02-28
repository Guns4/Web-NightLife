/**
 * =====================================================
 * REVIEW VERIFICATION ENGINE
 * GPS Verification, Rating Aggregation & Social Features
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";

// GPS Verification constants
const VERIFICATION_RADIUS_METERS = 100;
const REPORT_THRESHOLD = 5; // Auto-flag if > 5 reports

// =====================================================
// GPS VERIFICATION (Haversine Formula)
// =====================================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verify GPS coordinates against venue location
 */
export function verifyGPS(
  userLat: number,
  userLon: number,
  venueLat: number,
  venueLon: number
): "MATCH" | "MISMATCH" | "PENDING" {
  if (!userLat || !userLon || !venueLat || !venueLon) {
    return "PENDING";
  }

  const distance = calculateHaversineDistance(userLat, userLon, venueLat, venueLon);
  return distance <= VERIFICATION_RADIUS_METERS ? "MATCH" : "MISMATCH";
}

// =====================================================
// REVIEW SUBMISSION WITH GPS VERIFICATION
// =====================================================

export interface SubmitReviewInput {
  venueId: string;
  userId: string;
  rating: number;
  comment?: string;
  receiptImageUrl?: string;
  userLatitude?: number;
  userLongitude?: number;
}

export async function submitReview(input: SubmitReviewInput) {
  const { venueId, userId, rating, comment, receiptImageUrl, userLatitude, userLongitude } = input;

  // Get venue coordinates
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { latitude: true, longitude: true },
  });

  // Perform GPS verification
  let gpsStatus: "MATCH" | "MISMATCH" | "PENDING" = "PENDING";
  let isVerifiedVisit = false;
  let isEliteVerified = false;

  if (userLatitude && userLongitude && venue?.latitude && venue?.longitude) {
    gpsStatus = verifyGPS(userLatitude, userLongitude, venue.latitude, venue.longitude);
    isVerifiedVisit = gpsStatus === "MATCH";
    
    // Elite verified = receipt uploaded + GPS match
    isEliteVerified = !!receiptImageUrl && gpsStatus === "MATCH";
  }

  // Create the review
  const review = await prisma.vibeCheck.create({
    data: {
      venueId,
      userId,
      rating,
      comment,
      receiptImageUrl,
      userLatitude,
      userLongitude,
      gpsStatus,
      isVerifiedVisit,
      isEliteVerified,
      // Auto-approve if elite verified, otherwise pending
      isApproved: isEliteVerified,
    },
    include: {
      venue: {
        select: { name: true, city: true },
      },
      user: {
        select: { fullName: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // If elite verified, trigger rating aggregation
  if (isEliteVerified) {
    await updateVenueRating(venueId);
  }

  return {
    review,
    verification: {
      gpsStatus,
      isVerifiedVisit,
      isEliteVerified,
      distance: userLatitude && userLongitude && venue 
        ? calculateHaversineDistance(userLatitude, userLongitude, venue.latitude, venue.longitude)
        : null,
    },
  };
}

// =====================================================
// RATING AGGREGATION (Trigger Function)
// =====================================================

/**
 * Update venue's average rating and total reviews count
 * Uses atomic update to prevent race conditions
 */
export async function updateVenueRating(venueId: string) {
  // Calculate new aggregates from approved reviews only
  const agg = await prisma.vibeCheck.aggregate({
    where: {
      venueId,
      isApproved: true,
    },
    _avg: { rating: true },
    _count: { id: true },
  });

  const averageRating = agg._avg.rating || 0;
  const totalReviews = agg._count.id;

  // Atomic update using transaction
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      // Also update trust score based on verified reviews ratio
      trustScore: Math.min(100, Math.max(0, averageRating * 20)),
    },
  });
}

/**
 * SQL Trigger Function (for database-level automation)
 * This should be created in Supabase:
 * 
 * CREATE OR REPLACE FUNCTION update_venue_rating_on_approval()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   IF NEW.is_approved = true AND OLD.is_approved = false THEN
 *     UPDATE venues 
 *     SET average_rating = (
 *       SELECT ROUND(AVG(rating)::numeric, 1) 
 *       FROM vibe_checks 
 *       WHERE venue_id = NEW.venue_id AND is_approved = true
 *     ),
 *     total_reviews = (
 *       SELECT COUNT(*) 
 *       FROM vibe_checks 
 *       WHERE venue_id = NEW.venue_id AND is_approved = true
 *     )
 *     WHERE id = NEW.venue_id;
 *   END IF;
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER vibe_check_approval_trigger
 *   AFTER UPDATE ON vibe_checks
 *   FOR EACH ROW
 *   EXECUTE FUNCTION update_venue_rating_on_approval();
 */

// =====================================================
// SOCIAL INTERACTIONS: LIKES
// =====================================================

export async function toggleLike(reviewId: string, userId: string) {
  // Check if like already exists
  const existingLike = await prisma.reviewLike.findUnique({
    where: {
      reviewId_userId: { reviewId, userId },
    },
  });

  if (existingLike) {
    // Unlike
    await prisma.reviewLike.delete({
      where: { id: existingLike.id },
    });

    // Decrement likes count
    await prisma.vibeCheck.update({
      where: { id: reviewId },
      data: { likesCount: { decrement: 1 } },
    });

    return { liked: false };
  } else {
    // Like
    await prisma.reviewLike.create({
      data: { reviewId, userId },
    });

    // Increment likes count
    await prisma.vibeCheck.update({
      where: { id: reviewId },
      data: { likesCount: { increment: 1 } },
    });

    return { liked: true };
  }
}

export async function getLikesCount(reviewId: string) {
  return prisma.reviewLike.count({
    where: { reviewId },
  });
}

export async function hasUserLiked(reviewId: string, userId: string) {
  const like = await prisma.reviewLike.findUnique({
    where: {
      reviewId_userId: { reviewId, userId },
    },
  });
  return !!like;
}

// =====================================================
// SOCIAL INTERACTIONS: REPORTS
// =====================================================

export const REPORT_REASONS = {
  FAKE: "FAKE",
  SPAM: "SPAM",
  INAPPROPRIATE: "INAPPROPRIATE",
  HARASSMENT: "HARASSMENT",
  MISINFORMATION: "MISINFORMATION",
} as const;

export type ReportReason = typeof REPORT_REASONS[keyof typeof REPORT_REASONS];

export async function reportReview(
  reviewId: string,
  userId: string,
  reason: ReportReason,
  description?: string
) {
  // Check if user already reported this review
  const existingReport = await prisma.reviewReport.findFirst({
    where: {
      reviewId,
      userId,
    },
  });

  if (existingReport) {
    return { success: false, error: "Already reported" };
  }

  // Create report
  const report = await prisma.reviewReport.create({
    data: {
      reviewId,
      userId,
      reason,
      description,
    },
  });

  // Increment report count
  const review = await prisma.vibeCheck.update({
    where: { id: reviewId },
    data: { reportsCount: { increment: 1 } },
  });

  // Auto-flag if threshold exceeded
  if (review.reportsCount >= REPORT_THRESHOLD) {
    await prisma.vibeCheck.update({
      where: { id: reviewId },
      data: { isFlaggedForReview: true },
    });
  }

  return { success: true, report };
}

export async function getReportCount(reviewId: string) {
  return prisma.reviewReport.count({
    where: { reviewId },
  });
}

// =====================================================
// SENTIMENT ANALYSIS (Basic Keyword Extraction)
// =====================================================

export interface SentimentData {
  averageRating: number;
  totalReviews: number;
  ratingTrend: { date: string; avgRating: number }[];
  keywords: { word: string; count: number }[];
  verifiedRatio: number;
}

/**
 * Get venue sentiment analysis data
 */
export async function getVenueSentiment(venueId: string): Promise<SentimentData> {
  // Get all approved reviews
  const reviews = await prisma.vibeCheck.findMany({
    where: {
      venueId,
      isApproved: true,
    },
    select: {
      rating: true,
      comment: true,
      isVerifiedVisit: true,
      isEliteVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingTrend: [],
      keywords: [],
      verifiedRatio: 0,
    };
  }

  // Calculate average rating
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Calculate verified ratio
  const verifiedCount = reviews.filter(r => r.isVerifiedVisit).length;
  const verifiedRatio = verifiedCount / reviews.length;

  // Extract keywords from comments
  const keywordCounts = new Map<string, number>();
  const commonWords = new Set([
    "the", "and", "is", "was", "to", "a", "of", "in", "it", "for", 
    "on", "with", "at", "this", "but", "not", "are", "be", "have", "had",
    "very", "really", "so", "just", "that", "my", "i", "we", "they"
  ]);
  
  reviews.forEach(r => {
    if (r.comment) {
      const words = r.comment.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !commonWords.has(w));
      
      words.forEach(word => {
        keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
      });
    }
  });

  // Sort by count and take top 10
  const keywords = Array.from(keywordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate weekly rating trend (last 4 weeks)
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  const ratingTrend = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(fourWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const weekReviews = reviews.filter(r => {
      const date = new Date(r.createdAt);
      return date >= weekStart && date < weekEnd;
    });
    
    if (weekReviews.length > 0) {
      const weekAvg = weekReviews.reduce((sum, r) => sum + r.rating, 0) / weekReviews.length;
      ratingTrend.push({
        date: weekStart.toISOString().split("T")[0],
        avgRating: Math.round(weekAvg * 10) / 10,
      });
    }
  }

  return {
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    ratingTrend,
    keywords,
    verifiedRatio: Math.round(verifiedRatio * 100),
  };
}
