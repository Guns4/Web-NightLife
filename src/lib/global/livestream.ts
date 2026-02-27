/**
 * METAVERSE LIVE STREAM REVENUE
 * Phase 10: The Global Vibe Protocol & Metaverse
 * 
 * Features:
 * - Remote VIP tables in metaverse
 * - Live stream revenue split
 * - Virtual bottle service
 * - Exclusive digital experiences
 */

import { createClient } from '@supabase/supabase-js';

// Live stream status
export type StreamStatus = 
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'ended';

// VIP Table types for metaverse
export type MetaverseTableType = 
  | 'standard'    // Free view
  | 'silver'      // $50/hour
  | 'gold'        // $150/hour
  | 'platinum'    // $500/hour
  | 'vip'         // $1000/hour
  | 'owner';      // Exclusive, variable

// Table configurations
export const METAVERSE_TABLE_CONFIG: Record<MetaverseTableType, {
  price: number; // USD per hour
  perks: string[];
  maxOccupants: number;
  position: { x: number; y: number; z: number };
}> = {
  standard: {
    price: 0,
    perks: ['Basic view', 'Chat access'],
    maxOccupants: 1000,
    position: { x: 0, y: 0, z: 50 },
  },
  silver: {
    price: 50,
    perks: ['Front row view', 'Chat badge', 'React emojis'],
    maxOccupants: 50,
    position: { x: -20, y: 5, z: 20 },
  },
  gold: {
    price: 150,
    perks: ['Premium view', 'Private chat', 'Exclusive reactions', 'Digital badge'],
    maxOccupants: 20,
    position: { x: -10, y: 10, z: 10 },
  },
  platinum: {
    price: 500,
    perks: ['VIP view', 'Meet & greet priority', 'Digital swag', 'Exclusive chat'],
    maxOccupants: 10,
    position: { x: -5, y: 15, z: 5 },
  },
  vip: {
    price: 1000,
    perks: ['Private table', 'Direct interaction', 'Bottle service digital', 'Photo with DJ'],
    maxOccupants: 5,
    position: { x: 0, y: 20, z: 0 },
  },
  owner: {
    price: 0, // Variable
    perks: ['Full venue buyout', 'Custom experience', 'All revenue from table sales'],
    maxOccupants: 1,
    position: { x: 0, y: 25, z: 0 },
  },
};

// Revenue split configuration
export const REVENUE_SPLIT = {
  venue: 0.70,      // 70%
  platform: 0.15,   // 15%
  performer: 0.10,  // 10%
  liquidity: 0.05,  // 5% to VIBE rewards pool
};

// Metaverse live stream session
export interface MetaverseStreamSession {
  id: string;
  venueId: string;
  performerId: string;
  title: string;
  status: StreamStatus;
  startedAt?: number;
  endedAt?: number;
  viewerCount: number;
  totalRevenue: number;
  tables: MetaverseTableSale[];
}

// Table sale record
export interface MetaverseTableSale {
  id: string;
  sessionId: string;
  userId: string;
  tableType: MetaverseTableType;
  price: number;
  purchasedAt: number;
  duration: number; // minutes
}

/**
 * Create a new metaverse live stream session
 */
export async function createMetaverseSession(
  venueId: string,
  performerId: string,
  title: string,
  scheduledAt?: number
): Promise<MetaverseStreamSession> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const session: MetaverseStreamSession = {
    id: `meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    venueId,
    performerId,
    title,
    status: scheduledAt ? 'scheduled' : 'live',
    startedAt: scheduledAt,
    viewerCount: 0,
    totalRevenue: 0,
    tables: [],
  };

  await supabase
    .from('metaverse_sessions')
    .insert({
      id: session.id,
      venue_id: venueId,
      performer_id: performerId,
      title,
      status: session.status,
      started_at: session.startedAt,
      viewer_count: 0,
      total_revenue: 0,
    });

  return session;
}

/**
 * Purchase a table in metaverse
 */
export async function purchaseMetaverseTable(
  sessionId: string,
  userId: string,
  tableType: MetaverseTableType
): Promise<MetaverseTableSale | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const config = METAVERSE_TABLE_CONFIG[tableType];
  
  const sale: MetaverseTableSale = {
    id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    userId,
    tableType,
    price: config.price,
    purchasedAt: Date.now(),
    duration: 60, // 1 hour default
  };

  // Record the purchase
  await supabase
    .from('metaverse_table_sales')
    .insert({
      id: sale.id,
      session_id: sessionId,
      user_id: userId,
      table_type: tableType,
      price: sale.price,
      purchased_at: sale.purchasedAt,
      duration: sale.duration,
    });

  // Update session revenue (get current value and add)
  const { data: currentSession } = await supabase
    .from('metaverse_sessions')
    .select('total_revenue')
    .eq('id', sessionId)
    .single();
  
  const newRevenue = (currentSession?.total_revenue || 0) + sale.price;
  
  await supabase
    .from('metaverse_sessions')
    .update({ total_revenue: newRevenue })
    .eq('id', sessionId);

  return sale;
}

/**
 * Process revenue split for a session
 */
export async function processRevenueSplit(
  sessionId: string
): Promise<{
  venue: number;
  platform: number;
  performer: number;
  liquidity: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get session details
  const { data: session } = await supabase
    .from('metaverse_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  const totalRevenue = session.total_revenue || 0;
  
  const split = {
    venue: totalRevenue * REVENUE_SPLIT.venue,
    platform: totalRevenue * REVENUE_SPLIT.platform,
    performer: totalRevenue * REVENUE_SPLIT.performer,
    liquidity: totalRevenue * REVENUE_SPLIT.liquidity,
  };

  // Record the splits
  await supabase
    .from('revenue_splits')
    .insert({
      session_id: sessionId,
      venue_amount: split.venue,
      platform_amount: split.platform,
      performer_amount: split.performer,
      liquidity_amount: split.liquidity,
      created_at: Date.now(),
    });

  // Transfer to liquidity pool (VIBE tokens)
  // In production, this would trigger a smart contract call
  const liquidityInVibe = split.liquidity / 100; // Assuming $1 = 100 VIBE
  await supabase
    .from('token_rewards')
    .insert({
      type: 'liquidity_pool',
      amount: liquidityInVibe,
      session_id: sessionId,
      created_at: Date.now(),
    });

  return split;
}

/**
 * Get metaverse session analytics
 */
export interface MetaverseAnalytics {
  totalSessions: number;
  activeViewers: number;
  totalRevenue: number;
  averageTablePrice: number;
  topPerformingSessions: { title: string; revenue: number }[];
}

export async function getMetaverseAnalytics(
  venueId?: string
): Promise<MetaverseAnalytics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  let query = supabase
    .from('metaverse_sessions')
    .select('*');

  if (venueId) {
    query = query.eq('venue_id', venueId);
  }

  const { data: sessions } = await query;

  const totalSessions = sessions?.length || 0;
  const totalRevenue = sessions?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0;
  const activeViewers = sessions
    ?.filter(s => s.status === 'live')
    .reduce((sum, s) => sum + (s.viewer_count || 0), 0) || 0;

  const { data: tableSales } = await supabase
    .from('metaverse_table_sales')
    .select('price');

  const averageTablePrice = tableSales?.length 
    ? tableSales.reduce((sum, t) => sum + t.price, 0) / tableSales.length 
    : 0;

  const topPerformingSessions = (sessions || [])
    .map(s => ({ title: s.title, revenue: s.total_revenue || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalSessions,
    activeViewers,
    totalRevenue,
    averageTablePrice,
    topPerformingSessions,
  };
}

/**
 * Update viewer count for a session
 */
export async function updateViewerCount(
  sessionId: string,
  count: number
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  await supabase
    .from('metaverse_sessions')
    .update({ viewer_count: count })
    .eq('id', sessionId);
}
