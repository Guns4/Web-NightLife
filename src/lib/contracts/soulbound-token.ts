/**
 * SOULBOUND TOKEN (SBT) CONTRACT
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Concept: Non-transferable NFTs representing user identity and achievements
 * Standard: ERC-5192 (Soulbound Tokens)
 * 
 * Features:
 * - Non-transferable (bound to wallet)
 * - On-chain reputation score
 * - Verified achievements
 * - Tier status on-chain
 * - Zero-Knowledge Proofs for privacy
 */

export const SBT_CONFIG = {
  name: 'NightLife Soulbound Token',
  symbol: 'NL-SBT',
  network: 'polygon',
  chainId: 137,
  
  // SBT Token URI metadata template
  metadataBase: 'https://api.nightlife.id/sbt/',
  
  // Reputation scoring
  reputation: {
    maxScore: 1000,
    tiers: {
      newcomer: { min: 0, max: 100 },
      regular: { min: 101, max: 300 },
      influencer: { min: 301, max: 500 },
      vip: { min: 501, max: 750 },
      legend: { min: 751, max: 1000 },
    },
    // Points per action
    actions: {
      checkin: 5,
      review: 10,
      referral: 25,
      socialShare: 3,
      firstVenueVisit: 15,
      venueLoyalty: 20,
      weekendVisit: 8,
      vipEvent: 30,
      squadTable: 50,
      promotionCreated: 40,
    }
  },
  
  // Achievement badges
  achievements: {
    firstSteps: {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first check-in',
      icon: ' footprints',
      points: 10,
    },
    socialButterfly: {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Visit 10 different venues',
      icon: ' butterfly',
      points: 50,
    },
    nightOwl: {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Check-in 50 times',
      icon: ' owl',
      points: 100,
    },
    influencer: {
      id: 'influencer',
      name: 'Influencer',
      description: 'Refer 5 friends who join',
      icon: ' star',
      points: 75,
    },
    vipMember: {
      id: 'vip_member',
      name: 'VIP Member',
      description: 'Reach Platinum tier',
      icon: ' diamond',
      points: 150,
    },
    partyStarter: {
      id: 'party_starter',
      name: 'Party Starter',
      description: 'Create a promotion that gets 100+ claims',
      icon: ' rocket',
      points: 200,
    },
    collector: {
      id: 'collector',
      name: 'Collector',
      description: 'Own 5 different NFT passes',
      icon: ' trophy',
      points: 100,
    },
    cityExplorer: {
      id: 'city_explorer',
      name: 'City Explorer',
      description: 'Visit venues in 3 different cities',
      icon: ' globe',
      points: 75,
    },
    weekendWarrior: {
      id: 'weekend_warrior',
      name: 'Weekend Warrior',
      description: 'Visit 20 weekend events',
      icon: ' calendar',
      points: 80,
    },
    elite: {
      id: 'elite',
      name: 'Elite',
      description: 'Hold NL-SBT for 1 year',
      icon: ' crown',
      points: 250,
    },
  },
  
  // ZKP Verification types
  zkpVerification: {
    age21Plus: {
      id: 'age_21_plus',
      name: 'Age 21+',
      description: 'Verify you are 21 or older without revealing exact age',
      circuit: 'age_verification',
    },
    platinumStatus: {
      id: 'platinum_status',
      name: 'Platinum Status',
      description: 'Verify Platinum tier without revealing other details',
      circuit: 'tier_verification',
    },
    resident: {
      id: 'resident',
      name: 'City Resident',
      description: 'Verify you are a local resident',
      circuit: 'residence_verification',
    },
  }
};

/**
 * SBT ABI Fragments
 */
export const SBT_ABI = {
  // Soulbound Token Standard
  soulbound: [
    'function mint(address to, string tokenURI) returns (uint256)',
    'function burn(uint256 tokenId)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function locked(uint256 tokenId) view returns (bool)',
    'event Locked(uint256 tokenId)',
    'event Unlocked(uint256 tokenId)',
  ],
  
  // Reputation
  reputation: [
    'function updateReputation(address user, uint256 score)',
    'function getReputation(address user) view returns (uint256)',
    'function addAchievement(address user, bytes32 achievementId)',
    'function getAchievements(address user) view returns (bytes32[])',
    'function verifyCredential(address user, bytes32 credentialType, bytes proof) view returns (bool)',
    'event ReputationUpdated(address indexed user, uint256 newScore)',
    'event AchievementUnlocked(address indexed user, bytes32 achievementId)',
  ],
  
  // ZKP Verification
  zkp: [
    'function submitProof(bytes32 verificationType, bytes calldata proof) returns (bool)',
    'function getVerificationStatus(address user, bytes32 verificationType) view returns (bool)',
    'event ProofVerified(address indexed user, bytes32 verificationType)',
  ]
};

/**
 * Soulbound Token Data Interface
 */
export interface SoulboundTokenData {
  tokenId: number;
  owner: string;
  reputationScore: number;
  tier: string;
  achievements: string[];
  verifications: Record<string, boolean>;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * User Reputation Interface
 */
export interface UserReputation {
  score: number;
  tier: string;
  totalCheckins: number;
  totalReviews: number;
  totalReferrals: number;
  venuesVisited: number;
  citiesVisited: number;
  nftPasses: number;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Achievement Interface
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  progress?: number;
  requirement?: number;
}

/**
 * ZKP Proof Interface
 */
export interface ZKPProof {
  verificationType: string;
  proof: string;
  publicSignals: string[];
  verified: boolean;
  verifiedAt?: Date;
}

/**
 * DID Document Interface (W3C Standard)
 */
export interface DIDDocument {
  '@context': string[];
  id: string; // did:nl:wallet_address
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }[];
  authentication: string[];
  service: {
    id: string;
    type: string;
    serviceEndpoint: string;
  }[];
  // Custom NightLife fields
  nightlife: {
    reputationScore: number;
    tier: string;
    achievements: string[];
    verifications: Record<string, boolean>;
  };
}

/**
 * Generate DID for user
 */
export function generateDID(walletAddress: string): string {
  return `did:nl:${walletAddress.toLowerCase()}`;
}

/**
 * Get tier from reputation score
 */
export function getTierFromScore(score: number): string {
  const { tiers } = SBT_CONFIG.reputation;
  
  if (score >= tiers.legend.min) return 'legend';
  if (score >= tiers.vip.min) return 'vip';
  if (score >= tiers.influencer.min) return 'influencer';
  if (score >= tiers.regular.min) return 'regular';
  return 'newcomer';
}

/**
 * Calculate reputation score from user stats
 */
export function calculateReputation(stats: {
  checkins: number;
  reviews: number;
  referrals: number;
  venuesVisited: number;
  citiesVisited: number;
  nftPasses: number;
  squadTables: number;
  promotionsCreated: number;
  weekendVisits: number;
}): number {
  const { actions } = SBT_CONFIG.reputation;
  
  let score = 0;
  
  score += stats.checkins * actions.checkin;
  score += stats.reviews * actions.review;
  score += stats.referrals * actions.referral;
  score += (stats.venuesVisited - 1) * actions.firstVenueVisit; // First visit bonus
  score += stats.citiesVisited * 20; // City exploration bonus
  score += stats.nftPasses * 30; // Collector bonus
  score += stats.squadTables * actions.squadTable;
  score += stats.promotionsCreated * actions.promotionCreated;
  score += stats.weekendVisits * actions.weekendVisit;
  
  return Math.min(score, SBT_CONFIG.reputation.maxScore);
}

/**
 * Check if achievement is unlocked based on progress
 */
export function checkAchievementProgress(
  achievementId: string,
  currentProgress: number
): { unlocked: boolean; progress: number; requirement: number } {
  const achievement = Object.values(SBT_CONFIG.achievements).find(
    a => a.id === achievementId
  );
  
  if (!achievement) {
    return { unlocked: false, progress: currentProgress, requirement: 0 };
  }
  
  // Some achievements have implicit requirements
  const requirements: Record<string, number> = {
    socialButterfly: 10,
    nightOwl: 50,
    influencer: 5,
    collector: 5,
    cityExplorer: 3,
    weekendWarrior: 20,
  };
  
  const requirement = requirements[achievementId] || 1;
  const progress = Math.min(currentProgress / requirement, 1);
  
  return {
    unlocked: progress >= 1,
    progress: Math.round(progress * 100),
    requirement
  };
}