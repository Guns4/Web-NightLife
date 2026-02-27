/**
 * FRACTIONAL VENUE OWNERSHIP (STAKING REAL ESTATE)
 * Phase 10.6: Venue Tokenization (RWA)
 * 
 * Features:
 * - Stake $VIBE to own fractional shares
 * - Revenue share from venue
 * - Governance voting rights
 * - Community-funded expansion
 */

import { createClient } from '@supabase/supabase-js';

// Staking tiers
export type StakeTier = 
  | 'bronze'   // 1000 VIBE
  | 'silver'   // 5000 VIBE
  | 'gold'     // 25000 VIBE
  | 'platinum' // 100000 VIBE
  | 'diamond'; // 500000 VIBE

// Venue stake position
export interface VenueStake {
  id: string;
  userId: string;
  venueId: string;
  amount: number;
  tier: StakeTier;
  shares: number;
  claimedRewards: number;
  stakedAt: number;
  unlockAt?: number;
}

// Revenue share configuration
export const STAKE_CONFIG: Record<StakeTier, {
  minStake: number;
  sharesPerVibe: number;
  revenueShare: number;
  governanceWeight: number;
  cooldownDays: number;
}> = {
  bronze: {
    minStake: 1000,
    sharesPerVibe: 1,
    revenueShare: 0.001,
    governanceWeight: 1,
    cooldownDays: 30,
  },
  silver: {
    minStake: 5000,
    sharesPerVibe: 1.2,
    revenueShare: 0.0015,
    governanceWeight: 3,
    cooldownDays: 45,
  },
  gold: {
    minStake: 25000,
    sharesPerVibe: 1.5,
    revenueShare: 0.002,
    governanceWeight: 10,
    cooldownDays: 60,
  },
  platinum: {
    minStake: 100000,
    sharesPerVibe: 2,
    revenueShare: 0.003,
    governanceWeight: 25,
    cooldownDays: 90,
  },
  diamond: {
    minStake: 500000,
    sharesPerVibe: 3,
    revenueShare: 0.005,
    governanceWeight: 50,
    cooldownDays: 180,
  },
};

/**
 * Stake VIBE for venue ownership
 */
export async function stakeForVenue(
  userId: string,
  venueId: string,
  amount: number
): Promise<VenueStake> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Determine tier
  let tier: StakeTier = 'bronze';
  if (amount >= 500000) tier = 'diamond';
  else if (amount >= 100000) tier = 'platinum';
  else if (amount >= 25000) tier = 'gold';
  else if (amount >= 5000) tier = 'silver';

  const config = STAKE_CONFIG[tier];
  const shares = Math.floor(amount * config.sharesPerVibe);

  const stake: VenueStake = {
    id: `stake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    venueId,
    amount,
    tier,
    shares,
    claimedRewards: 0,
    stakedAt: Date.now(),
  };

  await supabase.from('venue_stakes').insert({
    id: stake.id,
    user_id: userId,
    venue_id: venueId,
    amount,
    tier,
    shares,
    claimed_rewards: 0,
    staked_at: stake.stakedAt,
  });

  // Lock tokens (would interact with smart contract in production)
  await supabase.from('token_locks').insert({
    user_id: userId,
    amount,
    locked_at: Date.now(),
    unlock_at: null,
    purpose: `venue_stake_${venueId}`,
  });

  return stake;
}

/**
 * Claim revenue rewards from stake
 */
export async function claimStakeRewards(
  stakeId: string
): Promise<{ amount: number; transactionHash: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get stake
  const result = await supabase
    .from('venue_stakes')
    .select('*')
    .eq('id', stakeId);
  const stake = result.data?.[0];

  if (!stake) {
    throw new Error('Stake not found');
  }

  // Calculate pending rewards
  const config = STAKE_CONFIG[stake.tier as StakeTier];
  
  // Get venue revenue (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const revenueResult = await supabase
    .from('venue_revenue')
    .select('amount')
    .eq('venue_id', stake.venue_id)
    .gte('timestamp', thirtyDaysAgo);
  
  const totalRevenue = revenueResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalShares = stake.shares; // Would get total shares for venue
  
  const pendingRewards = (totalRevenue * config.revenueShare * stake.shares) / Math.max(totalShares, 1);

  // Update claimed rewards
  await supabase
    .from('venue_stakes')
    .update({ claimed_rewards: stake.claimed_rewards + pendingRewards })
    .eq('id', stakeId);

  // Record transaction
  const txHash = `0x${Date.now().toString(16)}${Math.random().toString(36).substr(2, 8)}`;
  
  await supabase.from('stake_rewards').insert({
    stake_id: stakeId,
    amount: pendingRewards,
    transaction_hash: txHash,
    claimed_at: Date.now(),
  });

  return { amount: pendingRewards, transactionHash: txHash };
}

/**
 * Unstake (with cooldown)
 */
export async function unstake(
  stakeId: string
): Promise<{ availableAt: number; penalty: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const result = await supabase
    .from('venue_stakes')
    .select('*')
    .eq('id', stakeId);
  const stake = result.data?.[0];

  if (!stake) {
    throw new Error('Stake not found');
  }

  const config = STAKE_CONFIG[stake.tier as StakeTier];
  const cooldownMs = config.cooldownDays * 24 * 60 * 60 * 1000;
  const availableAt = Date.now() + cooldownMs;

  // Check early withdrawal penalty (if within first 7 days)
  const daysStaked = (Date.now() - stake.staked_at) / (24 * 60 * 60 * 1000);
  let penalty = 0;
  if (daysStaked < 7) {
    penalty = stake.amount * 0.1; // 10% penalty
  }

  // Update unlock time
  await supabase
    .from('venue_stakes')
    .update({ unlock_at: availableAt })
    .eq('id', stakeId);

  return { availableAt, penalty };
}

/**
 * Get governance weight for stake
 */
export async function getGovernanceWeight(
  userId: string,
  venueId?: string
): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  let query = supabase
    .from('venue_stakes')
    .select('tier, shares');

  if (venueId) {
    query = query.eq('venue_id', venueId);
  } else {
    query = query.eq('user_id', userId);
  }

  const result = await query;
  const stakes = result.data || [];

  let totalWeight = 0;
  stakes.forEach((s: any) => {
    const config = STAKE_CONFIG[s.tier as StakeTier];
    totalWeight += s.shares * config.governanceWeight;
  });

  return totalWeight;
}

/**
 * Get stake positions for user
 */
export async function getUserStakes(userId: string): Promise<VenueStake[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const result = await supabase
    .from('venue_stakes')
    .select('*')
    .eq('user_id', userId);

  return (result.data || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    venueId: s.venue_id,
    amount: s.amount,
    tier: s.tier,
    shares: s.shares,
    claimedRewards: s.claimed_rewards,
    stakedAt: s.staked_at,
    unlockAt: s.unlock_at,
  }));
}
