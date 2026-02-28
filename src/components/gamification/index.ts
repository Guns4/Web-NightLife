// Gamification Components
export { GlowProgressBar, StreakDisplay } from './GlowProgressBar';
export { LevelUpCelebration, XpGainToast } from './LevelUpCelebration';
export { BadgeCase, BadgeCard, AvailableBadges } from './BadgeCase';
export { Leaderboard } from './Leaderboard';

// Gamification Service
export { 
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
} from '@/lib/services/gamification/gamification-service';
