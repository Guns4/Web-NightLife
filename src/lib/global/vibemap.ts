/**
 * VIBE-MAP SPATIAL API
 * Phase 10.2: AR Cloud Layer
 * 
 * Features:
 * - AR Cloud for nightlife activity heatmaps
 * - Third-party app access to spatial data
 * - Digital heatmaps visible via phone/AR glasses
 * - On-chain verification
 */

import { createClient } from '@supabase/supabase-js';

// Spatial data types
export type SpatialDataType = 
  | 'crowd_density'
  | 'vibe_score'
  | 'line_wait'
  | 'price_level'
  | 'music_genre'
  | 'event_type';

// Heatmap intensity levels
export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4 | 5;

// API access tiers
export type APIAccessTier = 
  | 'free'      // 100 requests/day
  | 'basic'     // 1,000 requests/day
  | 'pro'       // 10,000 requests/day  
  | 'enterprise'; // Unlimited

// Spatial data point
export interface SpatialDataPoint {
  id: string;
  venueId: string;
  type: SpatialDataType;
  value: number | string;
  intensity: HeatmapIntensity;
  timestamp: number;
  lat: number;
  lng: number;
  verified: boolean;
  blockchainTx?: string;
}

// API Access configuration
export const SPATIAL_API_CONFIG: Record<APIAccessTier, {
  requestsPerDay: number;
  features: string[];
  pricePerMonth: number;
}> = {
  free: {
    requestsPerDay: 100,
    features: ['basic_heatmap', 'venue_list'],
    pricePerMonth: 0,
  },
  basic: {
    requestsPerDay: 1000,
    features: ['basic_heatmap', 'venue_list', 'real_time_updates', 'analytics'],
    pricePerMonth: 99,
  },
  pro: {
    requestsPerDay: 10000,
    features: ['basic_heatmap', 'venue_list', 'real_time_updates', 'analytics', 'predictions', 'export'],
    pricePerMonth: 499,
  },
  enterprise: {
    requestsPerDay: -1, // Unlimited
    features: ['all', 'dedicated_support', 'custom_integrations', 'white_label'],
    pricePerMonth: 4999,
  },
};

/**
 * Get spatial data for a geographic area
 */
export async function getSpatialData(
  lat: number,
  lng: number,
  radiusKm: number,
  types: SpatialDataType[]
): Promise<SpatialDataPoint[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get venues in radius
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, lat, lng')
    .filter('lat', 'gte', lat - 0.1)
    .filter('lat', 'lte', lat + 0.1)
    .filter('lng', 'gte', lng - 0.1)
    .filter('lng', 'lte', lng + 0.1);

  if (!venues || venues.length === 0) {
    return [];
  }

  const venueIds = venues.map(v => v.id);

  // Get latest spatial data for these venues
  const { data: spatialData } = await supabase
    .from('spatial_data')
    .select('*')
    .in('venue_id', venueIds)
    .in('type', types)
    .order('timestamp', { ascending: false })
    .limit(100);

  return (spatialData || []).map(d => ({
    id: d.id,
    venueId: d.venue_id,
    type: d.type,
    value: d.value,
    intensity: d.intensity,
    timestamp: d.timestamp,
    lat: d.lat,
    lng: d.lng,
    verified: d.verified,
    blockchainTx: d.blockchain_tx,
  }));
}

/**
 * Generate heatmap tiles for an area
 */
export interface HeatmapTile {
  x: number;
  y: number;
  z: number;
  data: { lat: number; lng: number; intensity: HeatmapIntensity }[];
}

export function generateHeatmapTiles(
  spatialData: SpatialDataPoint[],
  zoom: number
): HeatmapTile[] {
  // Group data into tiles based on zoom level
  const tileSize = Math.pow(2, zoom);
  const tiles: Record<string, HeatmapTile> = {};

  spatialData.forEach(point => {
    const tileX = Math.floor((point.lng + 180) / 360 * tileSize);
    const tileY = Math.floor(
      (1 - Math.log(Math.tan(point.lat * Math.PI / 180) + 1 / Math.cos(point.lat * Math.PI / 180)) / Math.PI) / 2 * tileSize
    );

    const key = `${zoom}-${tileX}-${tileY}`;
    
    if (!tiles[key]) {
      tiles[key] = { x: tileX, y: tileY, z: zoom, data: [] };
    }

    tiles[key].data.push({
      lat: point.lat,
      lng: point.lng,
      intensity: point.intensity,
    });
  });

  return Object.values(tiles);
}

/**
 * Record new spatial data point (from venue sensors)
 */
export async function recordSpatialData(
  venueId: string,
  type: SpatialDataType,
  value: number | string,
  lat: number,
  lng: number
): Promise<SpatialDataPoint> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Calculate intensity based on value
  let intensity: HeatmapIntensity = 0;
  if (type === 'crowd_density' && typeof value === 'number') {
    if (value < 20) intensity = 1;
    else if (value < 40) intensity = 2;
    else if (value < 60) intensity = 3;
    else if (value < 80) intensity = 4;
    else intensity = 5;
  }

  const dataPoint: SpatialDataPoint = {
    id: `sp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    venueId,
    type,
    value,
    intensity,
    timestamp: Date.now(),
    lat,
    lng,
    verified: false,
  };

  await supabase
    .from('spatial_data')
    .insert({
      id: dataPoint.id,
      venue_id: venueId,
      type,
      value,
      intensity,
      timestamp: dataPoint.timestamp,
      lat,
      lng,
      verified: false,
    });

  return dataPoint;
}

/**
 * Verify spatial data on-chain
 */
export async function verifySpatialDataOnChain(
  dataPointId: string
): Promise<string> {
  // Mock blockchain verification
  // In production, would call smart contract
  const txHash = `0x${Date.now().toString(16)}${Math.random().toString(36).substr(2, 8)}`;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  await supabase
    .from('spatial_data')
    .update({ verified: true, blockchain_tx: txHash })
    .eq('id', dataPointId);

  return txHash;
}

/**
 * API access management
 */
export async function checkAPIUsage(
  userId: string,
  tier: APIAccessTier
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = SPATIAL_API_CONFIG[tier];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();

  // Count today's requests
  const { count } = await supabase
    .from('spatial_api_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', startOfDay);

  const used = count || 0;
  const remaining = tier === 'enterprise' 
    ? -1 
    : Math.max(0, config.requestsPerDay - used);

  const resetAt = startOfDay + 24 * 60 * 60 * 1000;

  return {
    allowed: remaining !== 0,
    remaining,
    resetAt,
  };
}

/**
 * Record API request
 */
export async function recordAPIRequest(
  userId: string,
  endpoint: string,
  tier: APIAccessTier
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  await supabase
    .from('spatial_api_requests')
    .insert({
      user_id: userId,
      endpoint,
      tier,
      timestamp: Date.now(),
    });
}

/**
 * Get vibe score for a venue (aggregated metric)
 */
export async function getVibeScore(venueId: string): Promise<{
  score: number;
  breakdown: Record<SpatialDataType, number>;
  trend: 'up' | 'down' | 'stable';
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  let recentData: any[] = [];
  
  try {
    const result = await supabase
      .from('spatial_data')
      .select('*')
      .eq('venue_id', venueId)
      .gte('timestamp', hourAgo);
    
    recentData = result.data || [];
  } catch (e) {
    console.error('Error fetching vibe score:', e);
  }

  const breakdown: Record<SpatialDataType, number> = {
    crowd_density: 0,
    vibe_score: 0,
    line_wait: 0,
    price_level: 0,
    music_genre: 0,
    event_type: 0,
  };

  // Calculate weighted score
  if (recentData) {
    recentData.forEach((d: any) => {
      const weight = d.type === 'crowd_density' ? 0.3 : 
                    d.type === 'vibe_score' ? 0.4 : 0.1;
      breakdown[d.type as SpatialDataType] = (breakdown[d.type as SpatialDataType] || 0) + 
        (typeof d.value === 'number' ? d.value : 0) * weight;
    });
  }

  const score = Math.round(
    (breakdown.crowd_density + breakdown.vibe_score + breakdown.line_wait + 
     breakdown.price_level + breakdown.music_genre + breakdown.event_type) / 6
  );

  return {
    score,
    breakdown,
    trend: 'stable', // Would compare with previous hour
  };
}
