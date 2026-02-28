/**
 * =====================================================
 * REVIEW SERVICE
 * Shadow ban filtering for public review display
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";

// Rejection reason codes
export const REJECTION_REASON_CODES = {
  FAKE_REVIEW: "FAKE_REVIEW",
  INAPPROPRIATE: "INAPPROPRIATE",
  SPAM: "SPAM",
  POLICY_VIOLATION: "POLICY_VIOLATION",
  SELF_PROMOTION: "SELF_PROMOTION",
  COMPETITOR_ATTACK: "COMPETITOR_ATTACK",
} as const;

export type RejectionReasonCode = typeof REJECTION_REASON_CODES[keyof typeof REJECTION_REASON_CODES];

// Human-readable rejection reasons
export const REJECTION_REASONS: Record<RejectionReasonCode, string> = {
  FAKE_REVIEW: "This appears to be a fake or fabricated review",
  INAPPROPRIATE: "This review contains inappropriate content",
  SPAM: "This review appears to be spam",
  POLICY_VIOLATION: "This review violates our content policy",
  SELF_PROMOTION: "This review contains self-promotional content",
  COMPETITOR_ATTACK: "This appears to be a competitor attack",
};

/**
 * Get public reviews for a venue (filters out shadow-banned users)
 */
export async function getVenueReviews(venueId: string, options?: {
  limit?: number;
  offset?: number;
  includeUnapproved?: boolean; // For admin/owner view
  userId?: string; // If provided, shows user's own reviews even if shadow banned
}) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  
  // Build query - filter out shadow-banned users for public view
  const userFilter = options?.includeUnapproved 
    ? {} // Admin view - show all
    : { 
        isShadowBanned: false, // Public view - hide shadow-banned users
      };

  // If user is viewing their own profile, include their reviews regardless
  const reviewsWhere: any = {
    venueId,
  };

  // For public view, filter to approved only AND non-shadow-banned users
  if (!options?.includeUnapproved) {
    reviewsWhere.isApproved = true;
    reviewsWhere.user = {
      isShadowBanned: false,
    };
  }

  const reviews = await prisma.vibeCheck.findMany({
    where: reviewsWhere,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
          isShadowBanned: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.vibeCheck.count({ where: reviewsWhere });

  return {
    reviews,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + reviews.length < total,
    },
  };
}

/**
 * Get reviews for admin moderation
 */
export async function getPendingReviews(options?: {
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const reviews = await prisma.vibeCheck.findMany({
    where: {
      isApproved: false, // Not yet approved
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
          email: true,
          isShadowBanned: true,
        },
      },
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.vibeCheck.count({
    where: { isApproved: false },
  });

  return {
    reviews,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + reviews.length < total,
    },
  };
}

/**
 * Approve or reject a review
 */
export async function moderateReview(
  reviewId: string,
  action: "approve" | "reject",
  reasonCode?: RejectionReasonCode,
  reason?: string,
  reviewedBy?: string
) {
  if (action === "reject" && (!reasonCode || !reason)) {
    throw new Error("Rejection reason is required when rejecting a review");
  }

  const updateData: any = {
    isApproved: action === "approve",
    reviewedBy,
    reviewedAt: new Date(),
  };

  if (action === "reject") {
    updateData.rejectionReasonCode = reasonCode;
    updateData.rejectionReason = reason;
  }

  const review = await prisma.vibeCheck.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
      venue: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return review;
}

/**
 * Shadow ban a user (hides their reviews from public)
 */
export async function shadowBanUser(userId: string, banned: boolean = true) {
  return prisma.user.update({
    where: { id: userId },
    data: { isShadowBanned: banned },
    select: {
      id: true,
      email: true,
      fullName: true,
      isShadowBanned: true,
    },
  });
}

/**
 * Get user profile with their own reviews visible
 * This is used when a user views their own profile
 */
export async function getUserProfileWithReviews(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      city: true,
      role: true,
      isShadowBanned: true,
      trustScore: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  // Get all reviews by this user (including rejected ones for their own view)
  const reviews = await prisma.vibeCheck.findMany({
    where: { userId },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    user,
    reviews,
  };
}
