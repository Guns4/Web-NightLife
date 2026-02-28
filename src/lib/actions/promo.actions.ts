/**
 * =====================================================
 * PROMO SERVER ACTIONS
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

'use server';

import { revalidatePath } from 'next/cache';
import { 
  Promo, 
  CreatePromoInput, 
  PromoTier,
  TIER_PRICING 
} from '@/lib/services/promo-service';

// Simulated database - in production use Prisma/Postgres
const promoDb: Map<string, Promo> = new Map();

// =====================================================
// PROMO CRUD ACTIONS
// =====================================================

/**
 * Create a new promo for a venue
 */
export async function createPromo(input: CreatePromoInput): Promise<{ success: boolean; promo?: Promo; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    const promo: Promo = {
      id: crypto.randomUUID(),
      venueId: input.venueId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      tier: input.tier,
      boostScore: TIER_PRICING[input.tier].boostScore,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      budget: input.budget,
      impressions: 0,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    promoDb.set(promo.id, promo);
    
    revalidatePath('/dashboard/owner/promos');
    revalidatePath('/promo/[id]');
    
    return { success: true, promo };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get all promos for a venue
 */
export async function getVenuePromos(venueId: string): Promise<Promo[]> {
  return Array.from(promoDb.values())
    .filter(p => p.venueId === venueId)
    .sort((a, b) => b.boostScore - a.boostScore);
}

/**
 * Get promo by ID
 */
export async function getPromoById(id: string): Promise<Promo | null> {
  return promoDb.get(id) || null;
}

/**
 * Get active promos
 */
export async function getActivePromos(limit: number = 10): Promise<Promo[]> {
  const now = new Date();
  
  return Array.from(promoDb.values())
    .filter(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return p.status === 'active' && now >= start && now <= end;
    })
    .sort((a, b) => b.boostScore - a.boostScore)
    .slice(0, limit);
}

/**
 * Activate promo (after payment)
 */
export async function activatePromo(id: string): Promise<{ success: boolean; promo?: Promo; error?: string }> {
  try {
    const promo = promoDb.get(id);
    if (!promo) {
      return { success: false, error: 'Promo not found' };
    }
    
    promo.status = 'active';
    promo.updatedAt = new Date().toISOString();
    promoDb.set(id, promo);
    
    revalidatePath('/dashboard/owner/promos');
    revalidatePath('/promo/[id]');
    
    return { success: true, promo };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Pause promo
 */
export async function pausePromo(id: string): Promise<{ success: boolean; promo?: Promo; error?: string }> {
  try {
    const promo = promoDb.get(id);
    if (!promo) {
      return { success: false, error: 'Promo not found' };
    }
    
    promo.status = 'paused';
    promo.updatedAt = new Date().toISOString();
    promoDb.set(id, promo);
    
    revalidatePath('/dashboard/owner/promos');
    
    return { success: true, promo };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Resume paused promo
 */
export async function resumePromo(id: string): Promise<{ success: boolean; promo?: Promo; error?: string }> {
  try {
    const promo = promoDb.get(id);
    if (!promo) {
      return { success: false, error: 'Promo not found' };
    }
    
    promo.status = 'active';
    promo.updatedAt = new Date().toISOString();
    promoDb.set(id, promo);
    
    revalidatePath('/dashboard/owner/promos');
    
    return { success: true, promo };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Archive/delete promo
 */
export async function archivePromo(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const promo = promoDb.get(id);
    if (!promo) {
      return { success: false, error: 'Promo not found' };
    }
    
    promo.status = 'archived';
    promo.updatedAt = new Date().toISOString();
    promoDb.set(id, promo);
    
    revalidatePath('/dashboard/owner/promos');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Track impression
 */
export async function trackPromoImpression(id: string): Promise<void> {
  const promo = promoDb.get(id);
  if (promo) {
    promo.impressions++;
    promoDb.set(id, promo);
  }
}

/**
 * Track click
 */
export async function trackPromoClick(id: string): Promise<void> {
  const promo = promoDb.get(id);
  if (promo) {
    promo.clicks++;
    promoDb.set(id, promo);
  }
}

/**
 * Get tier pricing
 */
export async function getTierPricing(): Promise<typeof TIER_PRICING> {
  return TIER_PRICING;
}

/**
 * Calculate promo cost
 */
export async function calculatePromoCost(
  tier: PromoTier, 
  startDate: string, 
  endDate: string
): Promise<number> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return TIER_PRICING[tier].price * days;
}

/**
 * Search promos
 */
export async function searchPromos(query: string): Promise<Promo[]> {
  const now = new Date();
  const q = query.toLowerCase();
  
  return Array.from(promoDb.values())
    .filter(p => {
      if (p.status !== 'active') return false;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (now < start || now > end) return false;
      return p.title.toLowerCase().includes(q) || 
             p.description.toLowerCase().includes(q);
    })
    .sort((a, b) => b.boostScore - a.boostScore);
}

/**
 * Archive expired promos (for cron job)
 */
export async function archiveExpiredPromos(): Promise<number> {
  const now = new Date();
  let count = 0;
  
  for (const [id, promo] of promoDb.entries()) {
    const end = new Date(promo.endDate);
    if (end < now && promo.status === 'active') {
      promo.status = 'archived';
      promo.updatedAt = now.toISOString();
      promoDb.set(id, promo);
      count++;
    }
  }
  
  revalidatePath('/dashboard/owner/promos');
  revalidatePath('/promo/[id]');
  
  return count;
}
