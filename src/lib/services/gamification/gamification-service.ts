import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// XP Configuration
const XP_CONFIG = {
  REVIEW: {
    BASIC: 10,
    VERIFIED: 25,      // Verified receipt
    ELITE: 50,         // Elite verified (GPS + receipt)
    PHOTO: 15,         // Review with photo
  },
  VISIT: {
    CHECK_IN: 5,
    FIRST_VISIT: 20,   // First time at a venue
  },
  BOOKING: {
    COMPLETED: 15,
    NO_SHOW: -10,      // Penalty
  },
  REFERRAL: {
    REFERRED_JOIN: 50,
    REFERRED_FIRST_VISIT: 100,
  },
  STREAK: {
    BONUS_PER_DAY: 2,  // Extra XP per streak day
    MAX_BONUS: 20,     // Max streak bonus
  },
};

// Level thresholds (XP required to reach each level)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300,
];

/**
 * Generate unique referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AH';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Calculate level from XP
 */
export function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 5000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Initialize gamification profile for a user
 */
export async function initializeGamification(userId: string, referredBy?: string) {
  // Check if already exists
  const existing = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.userGamification.create({
    data: {
      userId,
      referralCode: generateReferralCode(),
      referredBy,
    },
  });
}

/**
 * Add XP to user and handle level ups
 */
export async function addXp(
  userId: string,
  amount: number,
  action: string
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  // Get current gamification data
  let gamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  // Initialize if not exists
  if (!gamification) {
    gamification = await initializeGamification(userId);
  }

  const previousLevel = gamification.currentLevel;
  const newTotalXp = gamification.totalXp + amount;
  const newCurrentXp = gamification.currentXp + amount;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > previousLevel;

  // Update gamification
  const updated = await prisma.userGamification.update({
    where: { userId },
    data: {
      currentXp: newCurrentXp,
      totalXp: newTotalXp,
      currentLevel: newLevel,
      lastActivityAt: new Date(),
    },
  });

  // Update streak
  await updateStreak(userId);

  return {
    newXp: updated.currentXp,
    newLevel: updated.currentLevel,
    leveledUp,
  };
}

/**
 * Handle review XP reward
 */
export async function handleReviewApproved(
  userId: string,
  isVerified: boolean,
  hasReceipt: boolean,
  hasPhoto: boolean
) {
  let xpAmount = XP_CONFIG.REVIEW.BASIC;

  if (hasReceipt && isVerified) {
    xpAmount = XP_CONFIG.REVIEW.ELITE;
  } else if (isVerified) {
    xpAmount = XP_CONFIG.REVIEW.VERIFIED;
  }

  if (hasPhoto) {
    xpAmount += XP_CONFIG.REVIEW.PHOTO;
  }

  // Update stats
  await prisma.userGamification.update({
    where: { userId },
    data: {
      totalReviews: { increment: 1 },
    },
  });

  return addXp(userId, xpAmount, 'REVIEW_APPROVED');
}

/**
 * Handle check-in XP reward
 */
export async function handleCheckIn(userId: string, venueId: string, isFirstVisit: boolean) {
  let xpAmount = XP_CONFIG.VISIT.CHECK_IN;

  if (isFirstVisit) {
    xpAmount += XP_CONFIG.VISIT.FIRST_VISIT;

    // Add to venues visited
    await prisma.userGamification.update({
      where: { userId },
      data: {
        venuesVisited: { push: venueId },
      },
    });
  }

  // Update stats
  await prisma.userGamification.update({
    where: { userId },
    data: {
      totalCheckIns: { increment: 1 },
    },
  });

  return addXp(userId, xpAmount, 'CHECK_IN');
}

/**
 * Handle completed reservation
 */
export async function handleReservationCompleted(userId: string, noShow: boolean = false) {
  const xpAmount = noShow ? XP_CONFIG.BOOKING.NO_SHOW : XP_CONFIG.BOOKING.COMPLETED;

  await prisma.userGamification.update({
    where: { userId },
    data: {
      totalVisits: { increment: 1 },
    },
  });

  return addXp(userId, xpAmount, noShow ? 'NO_SHOW' : 'RESERVATION_COMPLETED');
}

/**
 * Update streak
 */
async function updateStreak(userId: string) {
  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (!gamification) return;

  const lastActivity = gamification.lastActivityAt;
  const now = new Date();
  
  // Check if last activity was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = gamification.streakDays;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - increase streak
      newStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken - reset
      newStreak = 1;
    }
    // Same day - no change
  } else {
    newStreak = 1;
  }

  // Update longest streak if needed
  const longestStreak = Math.max(newStreak, gamification.longestStreak);

  // Calculate streak bonus
  const streakBonus = Math.min(newStreak * XP_CONFIG.STREAK.BONUS_PER_DAY, XP_CONFIG.STREAK.MAX_BONUS);

  await prisma.userGamification.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      longestStreak: longestStreak,
    },
  });

  return { streakDays: newStreak, streakBonus };
}

/**
 * Award a badge to user
 */
export async function awardBadge(userId: string, badgeCode: string) {
  // Find badge
  const badge = await prisma.badge.findUnique({
    where: { code: badgeCode },
  });

  if (!badge) {
    throw new Error(`Badge not found: ${badgeCode}`);
  }

  // Check if already has badge
  const existingBadge = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      },
    },
  });

  if (existingBadge) {
    return null; // Already has badge
  }

  // Award badge
  const userBadge = await prisma.userBadge.create({
    data: {
      userId,
      badgeId: badge.id,
    },
  });

  // Add XP reward if any
  if (badge.xpReward > 0) {
    await addXp(userId, badge.xpReward, `BADGE_${badgeCode}`);
  }

  return userBadge;
}

/**
 * Check and award badges based on user activity
 */
export async function checkAndAwardBadges(userId: string) {
  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (!gamification) return [];

  const awardedBadges: string[] = [];

  // Check milestones
  const badgeChecks = [
    { code: 'FIRST_DRINK', condition: gamification.totalReviews >= 1 },
    { code: 'CITY_EXPLORER', condition: (gamification.venuesVisited?.length || 0) >= 5 },
    { code: 'ELITE_REVIEWER', condition: gamification.totalReviews >= 10 },
    { code: 'NIGHT_OWL', condition: gamification.totalVisits >= 20 },
    { code: 'LOYAL_PATRON', condition: gamification.longestStreak >= 7 },
    { code: 'PARTY_LEGEND', condition: (gamification.venuesVisited?.length || 0) >= 10 },
  ];

  for (const check of badgeChecks) {
    if (check.condition) {
      try {
        await awardBadge(userId, check.code);
        awardedBadges.push(check.code);
      } catch {
        // Badge might already be awarded or not exist
      }
    }
  }

  return awardedBadges;
}

/**
 * Get user leaderboard by city
 */
export async function getLeaderboard(city?: string, limit: number = 10) {
  const where = city
    ? {
        user: {
          city: {
            equals: city,
            mode: 'insensitive',
          },
        },
      }
    : {};

  const leaders = await prisma.userGamification.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          city: true,
        },
      },
    },
    orderBy: {
      totalXp: 'desc',
    },
    take: limit,
  });

  return leaders.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    displayName: entry.user.displayName,
    avatarUrl: entry.user.avatarUrl,
    city: entry.user.city,
    level: entry.currentLevel,
    xp: entry.totalXp,
    streak: entry.streakDays,
  }));
}

/**
 * Process referral
 */
export async function processReferral(referralCode: string, newUserId: string) {
  // Find referrer
  const referrer = await prisma.userGamification.findFirst({
    where: { referralCode },
  });

  if (!referrer) {
    throw new Error('Invalid referral code');
  }

  // Initialize new user's gamification with referrer
  await initializeGamification(newUserId, referrer.userId);

  // Award XP to both
  await addXp(newUserId, XP_CONFIG.REFERRAL.REFERRED_JOIN, 'REFERRAL_JOIN');
  await addXp(referrer.userId, XP_CONFIG.REFERRAL.REFERRED_JOIN, 'REFERRAL_SIGNUP');

  // Update referral count
  await prisma.userGamification.update({
    where: { userId: referrer.userId },
    data: { referralCount: { increment: 1 } },
  });

  return {
    newUserXpAwarded: XP_CONFIG.REFERRAL.REFERRED_JOIN,
    referrerXpAwarded: XP_CONFIG.REFERRAL.REFERRED_JOIN,
  };
}

/**
 * Get user gamification profile
 */
export async function getUserGamification(userId: string) {
  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      userBadges: {
        include: {
          badge: true,
        },
      },
    },
  });

  if (!gamification) {
    return initializeGamification(userId);
  }

  const nextLevelXp = getXpForNextLevel(gamification.currentLevel);
  const currentLevelXp = gamification.currentLevel > 1 
    ? LEVEL_THRESHOLDS[gamification.currentLevel - 1] 
    : 0;
  const xpProgress = ((gamification.currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return {
    ...gamification,
    nextLevelXp,
    xpProgress: Math.min(100, Math.max(0, xpProgress)),
    levelThresholds: LEVEL_THRESHOLDS,
  };
}

export default {
  initializeGamification,
  addXp,
  handleReviewApproved,
  handleCheckIn,
  handleReservationCompleted,
  awardBadge,
  checkAndAwardBadges,
  getLeaderboard,
  processReferral,
  getUserGamification,
  calculateLevel,
  getXpForNextLevel,
};
