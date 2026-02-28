/**
 * =====================================================
 * PROMO & ADVERTISING SERVICE
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export type PromoTier = 'basic' | 'gold' | 'platinum';
export type PromoStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';

export interface Promo {
  id: string;
  venueId: string;
  venueName?: string;
  title: string;
  description: string;
  imageUrl: string;
  tier: PromoTier;
  boostScore: number;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  budget: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoInput {
  venueId: string;
  title: string;
  description: string;
  imageUrl: string;
  tier: PromoTier;
  startDate: string;
  endDate: string;
  budget: number;
}

// Tier boost scores
const TIER_BOOST_SCORES: Record<PromoTier, number> = {
  basic: 1,
  gold: 10,
  platinum: 100,
};

// In-memory store (replace with database in production)
const promos: Map<string, Promo> = new Map();

// =====================================================
// PROMO CRUD OPERATIONS
// =====================================================

/**
 * Create a new promo
 */
export async function createPromo(input: CreatePromoInput): Promise<Promo> {
  const now = new Date().toISOString();
  
  const promo: Promo = {
    id: uuidv4(),
    venueId: input.venueId,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    tier: input.tier,
    boostScore: TIER_BOOST_SCORES[input.tier],
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'draft',
    budget: input.budget,
    impressions: 0,
    clicks: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  promos.set(promo.id, promo);
  
  return promo;
}

/**
 * Get promo by ID
 */
export async function getPromo(id: string): Promise<Promo | null> {
  return promos.get(id) || null;
}

/**
 * Get all promos for a venue
 */
export async function getVenuePromos(venueId: string): Promise<Promo[]> {
  return Array.from(promos.values())
    .filter(p => p.venueId === venueId)
    .sort((a, b) => b.boostScore - a.boostScore);
}

/**
 * Get active promos (sorted by boost score)
 */
export async function getActivePromos(limit: number = 10): Promise<Promo[]> {
  const now = new Date();
  
  return Array.from(promos.values())
    .filter(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return p.status === 'active' && now >= start && now <= end;
    })
    .sort((a, b) => b.boostScore - a.boostScore)
    .slice(0, limit);
}

/**
 * Update promo status
 */
export async function updatePromoStatus(id: string, status: PromoStatus): Promise<Promo | null> {
  const promo = promos.get(id);
  if (!promo) return null;
  
  promo.status = status;
  promo.updatedAt = new Date().toISOString();
  promos.set(id, promo);
  
  return promo;
}

/**
 * Activate promo (triggered after payment)
 */
export async function activatePromo(id: string): Promise<Promo | null> {
  return updatePromoStatus(id, 'active');
}

/**
 * Pause promo
 */
export async function pausePromo(id: string): Promise<Promo | null> {
  return updatePromoStatus(id, 'paused');
}

/**
 * Archive expired promos
 */
export async function archiveExpiredPromos(): Promise<number> {
  const now = new Date();
  let count = 0;
  
  for (const [id, promo] of promos.entries()) {
    const end = new Date(promo.endDate);
    if (end < now && promo.status === 'active') {
      promo.status = 'archived';
      promo.updatedAt = now.toISOString();
      promos.set(id, promo);
      count++;
    }
  }
  
  return count;
}

/**
 * Track impression
 */
export async function trackImpression(id: string): Promise<void> {
  const promo = promos.get(id);
  if (promo) {
    promo.impressions++;
    promos.set(id, promo);
  }
}

/**
 * Track click
 */
export async function trackClick(id: string): Promise<void> {
  const promo = promos.get(id);
  if (promo) {
    promo.clicks++;
    promos.set(id, promo);
  }
}

/**
 * Search promos with boost sorting
 */
export async function searchPromos(query: string): Promise<Promo[]> {
  const now = new Date();
  const q = query.toLowerCase();
  
  return Array.from(promos.values())
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

// =====================================================
// TIER PRICING
// =====================================================

export const TIER_PRICING = {
  basic: {
    name: 'Basic',
    price: 50000, // IDR 50k/day
    boostScore: 1,
    features: ['Standard placement', 'Basic analytics'],
  },
  gold: {
    name: 'Gold',
    price: 150000, // IDR 150k/day
    boostScore: 10,
    features: ['Top 5 placement', 'Priority visibility', 'Basic analytics'],
  },
  platinum: {
    name: 'Platinum',
    price: 500000, // IDR 500k/day
    boostScore: 100,
    features: ['Featured placement', 'First position', 'Full analytics', 'Badge'],
  },
};

// =====================================================
// CLOUDINARY MEDIA UPLOAD
// =====================================================

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary with auto-resize and WebP
 */
export async function uploadPromoImage(
  file: Buffer,
  filename: string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary not configured');
  }
  
  // In production, would use Cloudinary SDK
  // This is a placeholder for the upload logic
  
  return {
    url: `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,f_auto,q_auto/promos/${filename}`,
    publicId: `promos/${filename}`,
    width: 1200,
    height: 630,
    format: 'webp',
  };
}
