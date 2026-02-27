/**
 * CROSS-BORDER LOYALTY (THE GLOBAL PASS)
 * Phase 10.4: Inter-Venue Liquidity
 * 
 * Features:
 * - Status recognized across partner venues globally
 * - DID-based identity verification
 * - Tier preservation across borders
 * - The Ibiza-Bali-Vegas Connection
 */

import { createClient } from '@supabase/supabase-js';

// Loyalty tiers
export type LoyaltyTier = 
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'black';

// Global pass types
export type GlobalPassType = 
  | 'standard'     // 3 partner venues
  | 'premium'      // 10 partner venues
  | 'elite'        // All partner venues
  | 'black_card';  // Unlimited + exclusive

// Partner network regions
export type Region = 
  | 'europe'    // Ibiza, London, Paris, Berlin
  | 'asia'      // Bali, Tokyo, Singapore, Bangkok
  | 'americas'  // Vegas, Miami, LA, NYC
  | 'oceania'   // Sydney, Melbourne;

// Partner venue
export interface PartnerVenue {
  id: string;
  name: string;
  region: Region;
  country: string;
  tier: LoyaltyTier;
  acceptedTiers: LoyaltyTier[];
  benefits: string[];
}

// User's global status
export interface GlobalStatus {
  userId: string;
  walletAddress: string;
  primaryTier: LoyaltyTier;
  verifiedAt: number;
  totalVisits: number;
  lifetimeSpend: number;
  partnerVisits: Record<string, number>;
  recognizedVenues: string[];
}

/**
 * Verify user's status at partner venue
 */
export async function verifyGlobalStatus(
  userId: string,
  venueId: string
): Promise<{ allowed: boolean; tier: LoyaltyTier; benefits: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get user's global status
  const userResult = await supabase
    .from('global_status')
    .select('*')
    .eq('user_id', userId);
  const userStatus = userResult.data?.[0];

  if (!userStatus) {
    return { allowed: false, tier: 'bronze', benefits: [] };
  }

  // Get venue
  const venueResult = await supabase
    .from('partner_venues')
    .select('*')
    .eq('id', venueId);
  const venue = venueResult.data?.[0];

  if (!venue) {
    return { allowed: false, tier: 'bronze', benefits: [] };
  }

  // Check if user's tier is accepted
  const tierHierarchy: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'black'];
  const userTierIndex = tierHierarchy.indexOf(userStatus.primary_tier);
  const acceptedIndex = venue.accepted_tiers.map((t: LoyaltyTier) => tierHierarchy.indexOf(t)).sort()[0];

  if (userTierIndex >= acceptedIndex) {
    return { allowed: true, tier: userStatus.primary_tier, benefits: venue.benefits };
  }

  return { allowed: false, tier: userStatus.primary_tier, benefits: [] };
}

/**
 * Record visit at partner venue
 */
export async function recordPartnerVisit(
  userId: string,
  venueId: string,
  spend: number
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get current values first
  const current = await supabase
    .from('global_status')
    .select('total_visits, lifetime_spend')
    .eq('user_id', userId)
    .single();

  const newTotalVisits = (current.data?.total_visits || 0) + 1;
  const newLifetimeSpend = (current.data?.lifetime_spend || 0) + spend;

  // Update visit count and lifetime spend
  await supabase
    .from('global_status')
    .update({
      total_visits: newTotalVisits,
      lifetime_spend: newLifetimeSpend,
    })
    .eq('user_id', userId);

  // Update partner-specific visits
  const partnerVisitsResult = await supabase
    .from('global_status')
    .select('partner_visits')
    .eq('user_id', userId)
    .single();
  
  const visits = partnerVisitsResult.data?.partner_visits || {};
  visits[venueId] = (visits[venueId] || 0) + 1;

  await supabase
    .from('global_status')
    .update({ partner_visits: JSON.stringify(visits) })
    .eq('user_id', userId);
}

/**
 * Check tier upgrade eligibility
 */
export async function checkTierUpgrade(
  userId: string
): Promise<{ currentTier: LoyaltyTier; nextTier: LoyaltyTier | null; progress: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const result = await supabase
    .from('global_status')
    .select('*')
    .eq('user_id', userId);
  const status = result.data?.[0];

  if (!status) {
    return { currentTier: 'bronze', nextTier: 'silver', progress: 0 };
  }

  const tiers: { tier: LoyaltyTier; visits: number; spend: number }[] = [
    { tier: 'bronze', visits: 0, spend: 0 },
    { tier: 'silver', visits: 10, spend: 1000 },
    { tier: 'gold', visits: 25, spend: 5000 },
    { tier: 'platinum', visits: 50, spend: 15000 },
    { tier: 'diamond', visits: 100, spend: 50000 },
    { tier: 'black', visits: 200, spend: 150000 },
  ];

  const currentTier = status.primary_tier as LoyaltyTier;
  const currentIndex = tiers.findIndex(t => t.tier === currentTier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1].tier : null;

  const visitsProgress = status.total_visits / (nextTier ? tiers[currentIndex + 1].visits : 1);
  const spendProgress = status.lifetime_spend / (nextTier ? tiers[currentIndex + 1].spend : 1);
  const progress = Math.min(100, Math.max(visitsProgress, spendProgress) * 100);

  return { currentTier, nextTier, progress };
}

/**
 * Get global pass benefits
 */
export function getGlobalPassBenefits(passType: GlobalPassType): {
  partnerCount: number;
  regions: Region[];
  benefits: string[];
  annualCost: number;
} {
  const passes = {
    standard: {
      partnerCount: 3,
      regions: ['europe'] as Region[],
      benefits: ['Priority entry', '1 free drink/month', 'Birthday reward'],
      annualCost: 199,
    },
    premium: {
      partnerCount: 10,
      regions: ['europe', 'asia'] as Region[],
      benefits: ['Skip the line', '2 free drinks/month', 'VIP area access', 'Birthday reward', 'Exclusive events'],
      annualCost: 499,
    },
    elite: {
      partnerCount: -1, // All
      regions: ['europe', 'asia', 'americas', 'oceania'] as Region[],
      benefits: ['All access', 'Unlimited drinks', 'Private booth access', 'Meet & greet', 'Personal concierge'],
      annualCost: 1999,
    },
    black_card: {
      partnerCount: -1,
      regions: ['europe', 'asia', 'americas', 'oceania'] as Region[],
      benefits: ['Everything in Elite', 'Jet setter package', 'Investment opportunities', 'Board access'],
      annualCost: 9999,
    },
  };

  return passes[passType];
}

/**
 * Get user's recognized venues worldwide
 */
export async function getUserRecognizedVenues(userId: string): Promise<PartnerVenue[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const userResult = await supabase
    .from('global_status')
    .select('*')
    .eq('user_id', userId);
  const userStatus = userResult.data?.[0];

  if (!userStatus) return [];

  const tier = userStatus.primary_tier;

  // Get partner venues that accept this tier
  const result = await supabase
    .from('partner_venues')
    .select('*');

  return (result.data || []).filter((v: any) => 
    v.accepted_tiers.includes(tier)
  ).map(v => ({
    id: v.id,
    name: v.name,
    region: v.region,
    country: v.country,
    tier: v.tier,
    acceptedTiers: v.accepted_tiers,
    benefits: v.benefits,
  }));
}
