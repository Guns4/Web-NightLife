/**
 * Dynamic Tiered Pricing Engine for Merchant Ads
 * Location-aware, time-sensitive pricing system
 */

// City Tier Configuration
export const CITY_TIERS = {
  TIER_1: ['Jakarta', 'Bali', 'jakarta', 'bali'],
  TIER_2: ['Surabaya', 'Bandung', 'Medan', 'surabaya', 'bandung', 'medan'],
  TIER_3: [] as string[], // All other cities
} as const;

// Base prices per day (in IDR)
export const BASE_PRICING = {
  // Intro pricing (first 130 days)
  INTRO: {
    homepage_banner: 300000,  // IDR 300k/day
    top_search: 200000,      // IDR 200k/day  
    featured_card: 150000,   // IDR 150k/day
  },
  // Normal pricing (after 130 days)
  NORMAL: {
    homepage_banner: 450000,  // 1.5x intro
    top_search: 300000,      // 1.5x intro
    featured_card: 225000,   // 1.5x intro
  },
} as const;

// Pricing multipliers
export const PRICING_MULTIPLIERS = {
  // Weekend surcharge (Friday & Saturday)
  WEEKEND_SURCHARGE: 1.4, // 40% surcharge
  
  // VVIP Bundle discount (7+ days)
  VVIP_DISCOUNT: 0.85, // 15% discount
  
  // City tier multipliers
  TIER_1_MULTIPLIER: 1.5,
  TIER_2_MULTIPLIER: 1.2,
  TIER_3_MULTIPLIER: 1.0,
} as const;

export type CityTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type AdSlotType = 'homepage_banner' | 'top_search' | 'featured_card';
export type PricingType = 'INTRO' | 'NORMAL';

export interface PriceBreakdown {
  basePrice: number;
  cityTier: CityTier;
  cityMultiplier: number;
  weekendSurcharge: number;
  vipDiscount: number;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
  isVip: boolean;
  isWeekend: boolean;
  pricingType: PricingType;
  daysRemaining: number;
}

export interface VenuePricingInfo {
  venueId: string;
  city: string;
  cityTier: CityTier;
  merchantSignupDate: string;
  daysSinceSignup: number;
  pricingType: PricingType;
  introDaysRemaining: number;
}

/**
 * Get city tier based on city name
 */
export function getCityTier(city: string): CityTier {
  const normalizedCity = city.toLowerCase();
  
  if (CITY_TIERS.TIER_1.some(c => normalizedCity.includes(c.toLowerCase()))) {
    return 'TIER_1';
  }
  
  if (CITY_TIERS.TIER_2.some(c => normalizedCity.includes(c.toLowerCase()))) {
    return 'TIER_2';
  }
  
  return 'TIER_3';
}

/**
 * Get city multiplier based on tier
 */
export function getCityMultiplier(tier: CityTier): number {
  switch (tier) {
    case 'TIER_1':
      return PRICING_MULTIPLIERS.TIER_1_MULTIPLIER;
    case 'TIER_2':
      return PRICING_MULTIPLIERS.TIER_2_MULTIPLIER;
    case 'TIER_3':
    default:
      return PRICING_MULTIPLIERS.TIER_3_MULTIPLIER;
  }
}

/**
 * Check if date is a weekend (Friday = 5, Saturday = 6)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

/**
 * Check if a day is Friday
 */
export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

/**
 * Check if a day is Saturday
 */
export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * Calculate if merchant is still in intro period
 * Intro period is 130 days from signup
 */
export function isIntroPeriod(merchantSignupDate: string | Date): {
  isIntro: boolean;
  daysSinceSignup: number;
  introDaysRemaining: number;
} {
  const signupDate = new Date(merchantSignupDate);
  const now = new Date();
  const diffTime = now.getTime() - signupDate.getTime();
  const daysSinceSignup = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const INTRO_DAYS = 130;
  const introDaysRemaining = Math.max(0, INTRO_DAYS - daysSinceSignup);
  
  return {
    isIntro: daysSinceSignup < INTRO_DAYS,
    daysSinceSignup,
    introDaysRemaining,
  };
}

/**
 * Get pricing type based on merchant signup date
 */
export function getPricingType(merchantSignupDate: string | Date): PricingType {
  const { isIntro } = isIntroPeriod(merchantSignupDate);
  return isIntro ? 'INTRO' : 'NORMAL';
}

/**
 * Get base price for a slot type
 */
export function getBasePrice(slotType: AdSlotType, pricingType: PricingType): number {
  const prices = pricingType === 'INTRO' 
    ? BASE_PRICING.INTRO 
    : BASE_PRICING.NORMAL;
  
  return prices[slotType];
}

/**
 * Calculate dynamic ad price
 * 
 * @param venueId - The venue ID
 * @param slotType - Type of ad slot
 * @param dates - Array of dates for the ad
 * @param city - City name (will fetch from DB if not provided)
 * @param merchantSignupDate - Merchant signup date for pricing type
 */
export async function calculateAdPrice(
  venueId: string,
  slotType: AdSlotType,
  dates: string[],
  city?: string,
  merchantSignupDate?: string
): Promise<PriceBreakdown> {
  // Get venue city from DB if not provided
  if (!city || !merchantSignupDate) {
    // In production, fetch from Supabase
    // For now, use defaults
    city = city || 'Jakarta';
    merchantSignupDate = merchantSignupDate || new Date().toISOString();
  }
  
  // Determine city tier
  const cityTier = getCityTier(city);
  const cityMultiplier = getCityMultiplier(cityTier);
  
  // Determine pricing type
  const pricingType = getPricingType(merchantSignupDate);
  const { introDaysRemaining } = isIntroPeriod(merchantSignupDate);
  
  // Get base price
  let basePrice = getBasePrice(slotType, pricingType);
  
  // Calculate price with city multiplier
  let priceWithCity = basePrice * cityMultiplier;
  
  // Calculate weekend surcharge
  let weekendSurcharge = 0;
  let weekendDays = 0;
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    if (isWeekend(date)) {
      weekendDays++;
      weekendSurcharge += priceWithCity * (PRICING_MULTIPLIERS.WEEKEND_SURCHARGE - 1);
    }
  }
  
  // Calculate total before discount
  const totalBeforeDiscount = (priceWithCity * dates.length) + weekendSurcharge;
  
  // Check for VVIP (7+ days)
  const isVip = dates.length >= 7;
  const vipDiscount = isVip 
    ? totalBeforeDiscount * (1 - PRICING_MULTIPLIERS.VVIP_DISCOUNT) 
    : 0;
  
  // Calculate final total
  const totalAfterDiscount = totalBeforeDiscount - vipDiscount;
  
  return {
    basePrice,
    cityTier,
    cityMultiplier,
    weekendSurcharge,
    vipDiscount,
    totalBeforeDiscount,
    totalAfterDiscount,
    isVip,
    isWeekend: weekendDays > 0,
    pricingType,
    daysRemaining: introDaysRemaining,
  };
}

/**
 * Format price to IDR currency
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate price for multiple days (summary)
 */
export function calculateDailyPriceBreakdown(
  basePrice: number,
  cityMultiplier: number,
  dates: string[]
): { date: string; dayOfWeek: string; isWeekend: boolean; price: number }[] {
  return dates.map(dateStr => {
    const date = new Date(dateStr);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const weekend = isWeekend(date);
    const dayPrice = basePrice * cityMultiplier * (weekend ? PRICING_MULTIPLIERS.WEEKEND_SURCHARGE : 1);
    
    return {
      date: dateStr,
      dayOfWeek,
      isWeekend: weekend,
      price: Math.round(dayPrice),
    };
  });
}
