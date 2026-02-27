/**
 * PHYGITAL BOTTLE SERVICE
 * Phase 10: The Global Vibe Protocol & Metaverse
 * 
 * Features:
 * - Buy Physical, Get Digital
 * - Digital wearables for avatars
 * - VVIP status across worlds
 */

export const PHYGITAL_CONFIG = {
  // Bottle tiers
  bottles: {
    standard: {
      name: 'Standard Bottle',
      price: 1500000, // IDR
      wearables: ['basic_aura'],
      tier: 'regular',
      validity: 30, // days
    },
    premium: {
      name: 'Premium Bottle',
      price: 3500000,
      wearables: ['premium_aura', 'glow_effect'],
      tier: 'gold',
      validity: 60,
    },
    elite: {
      name: 'Elite Bottle',
      price: 7500000,
      wearables: ['elite_aura', 'glow_effect', 'particle_effect'],
      tier: 'platinum',
      validity: 90,
      exclusiveAccess: true,
    },
    vip: {
      name: 'VIP Bottle',
      price: 15000000,
      wearables: ['vip_aura', 'glow_effect', 'particle_effect', 'legendary_frame'],
      tier: 'diamond',
      validity: 365,
      exclusiveAccess: true,
      vipStatus: true,
    },
  },
};

export interface PhygitalReward {
  id: string;
  bottleType: string;
  wearables: string[];
  tier: string;
  validityDays: number;
  vipStatus: boolean;
  unlockedAt: Date;
  expiresAt: Date;
}

/**
 * Create phygital reward
 */
export function createPhygitalReward(
  bottleType: keyof typeof PHYGITAL_CONFIG.bottles
): PhygitalReward {
  const bottle = PHYGITAL_CONFIG.bottles[bottleType];
  const now = new Date();
  const expires = new Date(now.getTime() + bottle.validity * 24 * 60 * 60 * 1000);
  
  return {
    id: `PGR-${Date.now()}`,
    bottleType,
    wearables: bottle.wearables,
    tier: bottle.tier,
    validityDays: bottle.validity,
    vipStatus: (bottle as any).vipStatus || false,
    unlockedAt: now,
    expiresAt: expires,
  };
}
