/**
 * SPATIAL ADS & AR OVERLAYS
 * Phase 10: The Global Vibe Protocol & Metaverse
 * 
 * Features:
 * - AR Scanner showing real-time venue data
 * - Spatial advertising placements
 * - Friend location overlays
 * - NFT coupon AR experiences
 */

import { createClient } from '@supabase/supabase-js';

// AR Overlay Types
export type OverlayType = 
  | 'crowd_density'
  | 'friend_locations'
  | 'nft_coupon'
  | 'venue_promo'
  | 'dj_now_playing'
  | 'vip_indicator';

export interface AROverlay {
  id: string;
  type: OverlayType;
  venueId: string;
  position: { x: number; y: number; z: number };
  data: Record<string, any>;
  visible: boolean;
  triggeredBy: string[]; // user_ids or conditions
}

export interface SpatialAdPlacement {
  id: string;
  venueId: string;
  zone: 'entrance' | 'bar' | 'dancefloor' | 'vip' | 'restroom';
  format: 'banner' | '3d_model' | 'video' | 'interactive';
  price: number; // per hour in VIBE tokens
  active: boolean;
  impressions: number;
  clicks: number;
}

// AR Scanner Configuration
export const AR_SCANNER_CONFIG = {
  // Detection ranges (meters)
  ranges: {
    near: 5,
    medium: 15,
    far: 50,
  },
  // Refresh rates (seconds)
  refreshRates: {
    crowdDensity: 30,
    friendLocations: 10,
    promotions: 60,
  },
  // Privacy settings
  privacy: {
    shareLocation: false,
    showRealNames: false,
    showDistance: true,
  },
};

/**
 * Generate AR overlays for a venue
 */
export async function getVenueAROverlays(venueId: string): Promise<AROverlay[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('ar_overlays')
    .select('*')
    .eq('venue_id', venueId)
    .eq('visible', true);

  if (error) {
    console.error('Error fetching AR overlays:', error);
    return [];
  }

  return data || [];
}

/**
 * Create spatial ad placement
 */
export async function createSpatialAd(
  venueId: string,
  zone: SpatialAdPlacement['zone'],
  format: SpatialAdPlacement['format'],
  price: number
): Promise<SpatialAdPlacement | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('spatial_ad_placements')
    .insert({
      venue_id: venueId,
      zone,
      format,
      price,
      active: true,
      impressions: 0,
      clicks: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating spatial ad:', error);
    return null;
  }

  return data;
}

/**
 * Track AR impression
 */
export async function trackARImpression(
  overlayId: string,
  userId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  await supabase
    .from('ar_impressions')
    .insert({
      overlay_id: overlayId,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
}

/**
 * Get crowd density data for venue
 */
export async function getCrowdDensity(venueId: string): Promise<{
  level: 'empty' | 'light' | 'medium' | 'busy' | 'packed';
  count: number;
  capacity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Get current check-in count
  const { data: checkins } = await supabase
    .from('checkins')
    .select('user_id')
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .gte('checked_in_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

  // Get venue capacity
  const { data: venue } = await supabase
    .from('venues')
    .select('capacity')
    .eq('id', venueId)
    .single();

  const count = checkins?.length || 0;
  const capacity = venue?.capacity || 100;
  const ratio = count / capacity;

  let level: 'empty' | 'light' | 'medium' | 'busy' | 'packed';
  if (ratio < 0.2) level = 'empty';
  else if (ratio < 0.4) level = 'light';
  else if (ratio < 0.6) level = 'medium';
  else if (ratio < 0.8) level = 'busy';
  else level = 'packed';

  return {
    level,
    count,
    capacity,
    trend: 'stable', // Would need historical data to calculate
  };
}

/**
 * Spatial ad analytics
 */
export interface SpatialAdAnalytics {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  revenue: number;
  topPerformingZones: { zone: string; revenue: number }[];
}

export async function getSpatialAdAnalytics(
  venueId: string,
  dateRange: { start: Date; end: Date }
): Promise<SpatialAdAnalytics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Get all placements
  const { data: placements } = await supabase
    .from('spatial_ad_placements')
    .select('*')
    .eq('venue_id', venueId);

  const totalImpressions = placements?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0;
  const totalClicks = placements?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const revenue = placements?.reduce((sum, p) => sum + (p.impressions || 0) * p.price * 0.0001, 0) || 0;

  // Group by zone
  const zoneRevenue: Record<string, number> = {};
  placements?.forEach((p) => {
    if (!zoneRevenue[p.zone]) zoneRevenue[p.zone] = 0;
    zoneRevenue[p.zone] += (p.impressions || 0) * p.price * 0.0001;
  });

  const topPerformingZones = Object.entries(zoneRevenue)
    .map(([zone, revenue]) => ({ zone, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalImpressions,
    totalClicks,
    ctr,
    revenue,
    topPerformingZones,
  };
}
