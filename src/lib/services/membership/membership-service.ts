/**
 * =====================================================
 * MEMBERSHIP SERVICE
 * AfterHoursID - NightPass Subscription Engine
 * =====================================================
 */

import { createHmac, createHash } from 'crypto';

// Types
export type MembershipTier = 'none' | 'silver' | 'gold' | 'platinum' | 'vip';
export type MembershipStatus = 'inactive' | 'active' | 'cancelled' | 'expired' | 'frozen';

export interface MembershipPlan {
  id: string;
  name: string;
  tier: MembershipTier;
  description: string;
  price_monthly: number;
  price_yearly: number;
  benefits: MembershipBenefits;
  features: string[];
  is_active: boolean;
}

export interface MembershipBenefits {
  free_entry: number;
  free_drinks: number;
  skip_line: boolean;
  vip_access: boolean;
  guest_list: number;
  discount_percentage: number;
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  tier: MembershipTier;
  status: MembershipStatus;
  subscription_id?: string;
  current_period_start?: Date;
  current_period_end?: Date;
  renewal_date?: Date;
  cancelled_at?: Date;
  benefits: MembershipBenefits;
  benefits_used: MembershipBenefits;
  benefits_reset_at?: Date;
  qr_secret?: string;
  qr_generated_at?: Date;
  created_at: Date;
}

export interface BenefitRedemption {
  id: string;
  user_membership_id: string;
  user_id: string;
  venue_id: string;
  benefit_type: string;
  benefit_value: number;
  redeemed_at: Date;
  partner_payout_amount?: number;
}

// Membership Plans (mock)
const PLANS: MembershipPlan[] = [
  {
    id: 'plan-silver',
    name: 'Silver NightPass',
    tier: 'silver',
    description: 'Entry-level membership with exclusive benefits',
    price_monthly: 299000,
    price_yearly: 2990000,
    benefits: {
      free_entry: 2,
      free_drinks: 1,
      skip_line: true,
      vip_access: false,
      guest_list: 0,
      discount_percentage: 10,
    },
    features: ['Priority Entry', '2 Free Club Entries', '1 Free Drink', '10% Venue Discount'],
    is_active: true,
  },
  {
    id: 'plan-gold',
    name: 'Gold NightPass',
    tier: 'gold',
    description: 'Premium membership with VIP access',
    price_monthly: 599000,
    price_yearly: 5990000,
    benefits: {
      free_entry: 5,
      free_drinks: 3,
      skip_line: true,
      vip_access: true,
      guest_list: 2,
      discount_percentage: 20,
    },
    features: ['VIP Entry', '5 Free Club Entries', '3 Free Drinks', '2 Guest List Spots', '20% Discount'],
    is_active: true,
  },
  {
    id: 'plan-platinum',
    name: 'Platinum NightPass',
    tier: 'platinum',
    description: 'Ultimate nightlife experience',
    price_monthly: 999000,
    price_yearly: 9990000,
    benefits: {
      free_entry: 999,
      free_drinks: 999,
      skip_line: true,
      vip_access: true,
      guest_list: 999,
      discount_percentage: 30,
    },
    features: ['Unlimited VIP Entry', 'Unlimited Free Drinks', 'Unlimited Guest List', '30% Discount', 'Private Events'],
    is_active: true,
  },
];

// In-memory store (use database in production)
const memberships = new Map<string, UserMembership>();

/**
 * Get all membership plans
 */
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  return PLANS.filter(p => p.is_active);
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId: string): Promise<MembershipPlan | null> {
  return PLANS.find(p => p.id === planId) || null;
}

/**
 * Get user membership
 */
export async function getUserMembership(userId: string): Promise<UserMembership | null> {
  return memberships.get(userId) || null;
}

/**
 * Create new membership subscription
 */
export async function createSubscription(
  userId: string,
  planId: string,
  subscriptionId: string
): Promise<UserMembership> {
  const plan = await getPlanById(planId);
  if (!plan) {
    throw new Error('Invalid plan');
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const membership: UserMembership = {
    id: `membership-${Date.now()}`,
    user_id: userId,
    plan_id: planId,
    tier: plan.tier,
    status: 'active',
    subscription_id: subscriptionId,
    current_period_start: now,
    current_period_end: periodEnd,
    renewal_date: periodEnd,
    benefits: plan.benefits,
    benefits_used: {
      free_entry: 0,
      free_drinks: 0,
      skip_line: false,
      vip_access: false,
      guest_list: 0,
      discount_percentage: 0,
    },
    benefits_reset_at: periodEnd,
    qr_secret: generateQRSecret(),
    qr_generated_at: now,
    created_at: now,
  };

  memberships.set(userId, membership);

  return membership;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  const membership = memberships.get(userId);
  if (!membership) {
    return false;
  }

  membership.status = 'cancelled';
  membership.cancelled_at = new Date();
  memberships.set(userId, membership);

  return true;
}

/**
 * Check if benefit is available
 */
export async function checkBenefit(
  userId: string,
  benefitType: keyof MembershipBenefits
): Promise<{ available: boolean; remaining: number }> {
  const membership = memberships.get(userId);
  
  if (!membership || membership.status !== 'active') {
    return { available: false, remaining: 0 };
  }

  // Check if benefits need reset
  if (membership.benefits_reset_at && new Date() > membership.benefits_reset_at) {
    await resetBenefits(userId);
    const updated = memberships.get(userId)!;
    const remaining = (updated.benefits[benefitType] as number) - (updated.benefits_used[benefitType] as number);
    return { available: remaining > 0, remaining: Math.max(0, remaining) };
  }

  const total = membership.benefits[benefitType];
  const used = membership.benefits_used[benefitType];
  const remaining = (total as number) - (used as number);

  return { available: remaining > 0, remaining: Math.max(0, remaining) };
}

/**
 * Redeem a benefit
 */
export async function redeemBenefit(
  userId: string,
  venueId: string,
  benefitType: keyof MembershipBenefits
): Promise<{ success: boolean; redemption?: BenefitRedemption; error?: string }> {
  const membership = memberships.get(userId);
  
  if (!membership || membership.status !== 'active') {
    return { success: false, error: 'No active membership' };
  }

  const { available, remaining } = await checkBenefit(userId, benefitType);
  
  if (!available) {
    return { success: false, error: `No ${benefitType} remaining. Used: ${membership.benefits_used[benefitType]}/${membership.benefits[benefitType]}` };
  }

  // Increment used
  const used = (membership.benefits_used[benefitType] as number) + 1;
  membership.benefits_used = {
    ...membership.benefits_used,
    [benefitType]: used,
  };
  memberships.set(userId, membership);

  // Create redemption record
  const redemption: BenefitRedemption = {
    id: `redemption-${Date.now()}`,
    user_membership_id: membership.id,
    user_id: userId,
    venue_id: venueId,
    benefit_type: benefitType,
    benefit_value: membership.benefits[benefitType] as number,
    redeemed_at: new Date(),
  };

  return { success: true, redemption };
}

/**
 * Reset benefits monthly
 */
export async function resetBenefits(userId: string): Promise<void> {
  const membership = memberships.get(userId);
  if (!membership) return;

  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setMonth(nextReset.getMonth() + 1);

  membership.benefits_used = {
    free_entry: 0,
    free_drinks: 0,
    skip_line: false,
    vip_access: false,
    guest_list: 0,
    discount_percentage: 0,
  };
  membership.benefits_reset_at = nextReset;
  memberships.set(userId, membership);
}

// =====================================================
// QR CODE GENERATION (TOTP)
// =====================================================

/**
 * Generate QR secret
 */
function generateQRSecret(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Generate time-based OTP for QR
 */
export function generateTOTP(secret: string): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeWindow = Math.floor(epoch / 60); // 60 second window
  
  const hmac = createHmac('sha1', secret);
  hmac.update(timeWindow.toString());
  
  const hash = hmac.digest('hex');
  const offset = parseInt(hash.substring(hash.length - 1), 16);
  const code = (parseInt(hash.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Generate dynamic QR code data for user
 */
export async function generateQRCode(userId: string): Promise<{
  qrData: string;
  expiresAt: Date;
  otp: string;
}> {
  const membership = memberships.get(userId);
  
  if (!membership || membership.status !== 'active') {
    throw new Error('No active membership');
  }

  // Generate new OTP every 60 seconds
  const otp = generateTOTP(membership.qr_secret!);
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + 60);

  // QR Data contains: membership_id, user_id, timestamp, otp
  const qrData = JSON.stringify({
    membership_id: membership.id,
    user_id: userId,
    timestamp: Date.now(),
    otp,
    tier: membership.tier,
  });

  return { qrData, expiresAt, otp };
}

/**
 * Verify QR code (for partner scanner)
 */
export async function verifyQRCode(
  qrData: string,
  venueId: string
): Promise<{
  valid: boolean;
  membership?: UserMembership;
  access?: {
    granted: boolean;
    benefit?: string;
    reason?: string;
  };
}> {
  try {
    const data = JSON.parse(qrData);
    
    // Check if membership exists
    const membership = memberships.get(data.user_id);
    
    if (!membership) {
      return { valid: false };
    }

    // Verify OTP
    const expectedOtp = generateTOTP(membership.qr_secret!);
    if (data.otp !== expectedOtp) {
      return { valid: false };
    }

    // Check membership status
    if (membership.status !== 'active') {
      return {
        valid: true,
        membership,
        access: { granted: false, reason: `Membership ${membership.status}` },
      };
    }

    // Check if VIP access available
    if (membership.tier === 'platinum' || membership.tier === 'vip' || membership.benefits.vip_access) {
      return {
        valid: true,
        membership,
        access: { granted: true, benefit: 'vip_access' },
      };
    }

    // Check skip line benefit
    if (membership.benefits.skip_line) {
      return {
        valid: true,
        membership,
        access: { granted: true, benefit: 'skip_line' },
      };
    }

    return {
      valid: true,
      membership,
      access: { granted: false, reason: 'No applicable benefits' },
    };

  } catch {
    return { valid: false };
  }
}

/**
 * Check VIP access status
 */
export async function checkVipAccess(userId: string): Promise<{
  hasAccess: boolean;
  tier: MembershipTier;
  benefits: MembershipBenefits;
}> {
  const membership = memberships.get(userId);
  
  if (!membership || membership.status !== 'active') {
    return { hasAccess: false, tier: 'none', benefits: {} as MembershipBenefits };
  }

  const hasAccess = membership.tier === 'platinum' || 
                    membership.tier === 'vip' || 
                    membership.benefits.vip_access;

  return {
    hasAccess,
    tier: membership.tier,
    benefits: membership.benefits,
  };
}
