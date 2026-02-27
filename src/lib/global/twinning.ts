/**
 * PHYGITAL TWINNING
 * Phase 10.3: Real-Time Sync with IoT
 */

import { createClient } from '@supabase/supabase-js';

export type TwinStatus = 'offline' | 'online' | 'busy' | 'packed' | 'event';
export type SensorType = 'people_counter' | 'noise_level' | 'temperature' | 'motion' | 'bottle_pop';

export interface PhygitalTwin {
  id: string;
  venueId: string;
  metaverseId: string;
  status: TwinStatus;
  crowdCount: number;
  capacity: number;
  vibeLevel: number;
  musicGenre: string;
  lastSync: number;
  visualState: { lights: string; fog: boolean; lasers: boolean; confetti: boolean };
}

export interface BottlePopEvent {
  id: string;
  twinId: string;
  tableId: string;
  bottle: string;
  price: number;
  recipientWallet: string;
  animation: string;
  timestamp: number;
  visibleInMetaverse: boolean;
}

export async function syncSensorToTwin(
  venueId: string,
  sensorType: SensorType,
  value: number
): Promise<PhygitalTwin | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
  const result = await supabase.from('digital_twins').select('*').eq('venue_id', venueId);
  const twin = result.data?.[0];
  if (!twin) return null;
  const updates: Record<string, any> = { last_sync: Date.now() };
  if (sensorType === 'people_counter') {
    updates.crowd_count = value;
    const ratio = value / twin.capacity;
    updates.status = ratio < 0.3 ? 'online' : ratio < 0.6 ? 'busy' : 'packed';
  } else if (sensorType === 'noise_level') {
    updates.vibe_level = Math.min(100, value);
  }
  await supabase.from('digital_twins').update(updates).eq('id', twin.id);
  return { ...twin, ...updates };
}

export async function triggerMetaverseBottlePop(
  venueId: string,
  tableId: string,
  bottle: string,
  price: number,
  recipientWallet: string
): Promise<BottlePopEvent> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
  const twinResult = await supabase.from('digital_twins').select('*').eq('venue_id', venueId);
  const twin = twinResult.data?.[0];
  let animation = 'sparkles';
  if (price > 1000) animation = 'fireworks';
  else if (price > 500) animation = 'confetti';
  else if (price > 200) animation = 'lasers';
  const event: BottlePopEvent = {
    id: `bottle-${Date.now()}`,
    twinId: twin?.id || '',
    tableId, bottle, price, recipientWallet, animation,
    timestamp: Date.now(), visibleInMetaverse: true,
  };
  await supabase.from('bottle_pop_events').insert({
    id: event.id, twin_id: event.twinId, table_id: tableId, bottle, price,
    recipient_wallet: recipientWallet, animation, timestamp: event.timestamp, visible_in_metaverse: true,
  });
  return event;
}

export async function getTwinState(venueId: string): Promise<PhygitalTwin | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
  const result = await supabase.from('digital_twins').select('*').eq('venue_id', venueId);
  const data = result.data?.[0];
  if (!data) return null;
  return {
    id: data.id, venueId: data.venue_id, metaverseId: data.metaverse_id, status: data.status,
    crowdCount: data.crowd_count, capacity: data.capacity, vibeLevel: data.vibe_level,
    musicGenre: data.music_genre, lastSync: data.last_sync, visualState: data.visual_state,
  };
}

export async function getMetaverseView(venueId: string): Promise<{ venueId: string; avatarCount: number; activeEvents: BottlePopEvent[]; audioStream: string }> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
  const twinResult = await supabase.from('digital_twins').select('*').eq('venue_id', venueId);
  const twin = twinResult.data?.[0];
  return { venueId, avatarCount: twin?.crowd_count || 0, activeEvents: [], audioStream: `wss://meta.vibeprotocol.live/${venueId}/audio` };
}
