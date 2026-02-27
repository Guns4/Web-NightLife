'use server';

/**
 * STATION MANAGEMENT ACTIONS
 * Phase 4.2: Owner Dashboard Station Management
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Station {
  id: string;
  venue_id: string;
  name: string;
  station_type: string;
  secret_key: string;
  qr_code_url: string;
  qr_color: string;
  nfc_tag_id: string;
  nfc_writeable: boolean;
  totp_enabled: boolean;
  totp_period: number;
  totp_digits: number;
  is_active: boolean;
  is_online: boolean;
  min_tier_access: string;
  cover_charge: number;
  total_checkins: number;
  last_checkin_at: string | null;
  created_at: string;
  updated_at: string;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get all stations for a venue
 */
export async function getVenueStations(venueId: string): Promise<Station[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('venue_stations')
    .select('*')
    .eq('venue_id', venueId)
    .order('name');
  
  if (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new station
 */
export async function createStation(
  venueId: string,
  ownerId: string,
  stationData: {
    name: string;
    station_type: string;
    min_tier_access?: string;
    cover_charge?: number;
    qr_color?: string;
  }
): Promise<{ success: boolean; station?: Station; message: string }> {
  const supabase = getSupabase();
  
  try {
    // Generate secret key
    const secretKey = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('venue_stations')
      .insert({
        venue_id: venueId,
        name: stationData.name,
        station_type: stationData.station_type,
        secret_key: secretKey,
        qr_color: stationData.qr_color || '#C026D3',
        min_tier_access: stationData.min_tier_access || 'bronze',
        cover_charge: stationData.cover_charge || 0,
        is_active: true,
        is_online: true
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, message: 'Gagal membuat stasiun' };
    }
    
    revalidatePath('/dashboard/owner');
    return { success: true, station: data, message: 'Stasiun berhasil dibuat' };
    
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan' };
  }
}

/**
 * Update station
 */
export async function updateStation(
  stationId: string,
  ownerId: string,
  updates: Partial<Station>
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  
  try {
    const { error } = await supabase
      .from('venue_stations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId);
    
    if (error) {
      return { success: false, message: 'Gagal memperbarui stasiun' };
    }
    
    revalidatePath('/dashboard/owner');
    return { success: true, message: 'Stasiun berhasil diperbarui' };
    
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan' };
  }
}

/**
 * Delete station
 */
export async function deleteStation(
  stationId: string,
  ownerId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  
  try {
    const { error } = await supabase
      .from('venue_stations')
      .delete()
      .eq('id', stationId);
    
    if (error) {
      return { success: false, message: 'Gagal menghapus stasiun' };
    }
    
    revalidatePath('/dashboard/owner');
    return { success: true, message: 'Stasiun berhasil dihapus' };
    
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan' };
  }
}

/**
 * Toggle station active status
 */
export async function toggleStationActive(
  stationId: string,
  ownerId: string
): Promise<{ success: boolean; isActive: boolean; message: string }> {
  const supabase = getSupabase();
  
  try {
    // Get current status
    const { data: station } = await supabase
      .from('venue_stations')
      .select('is_active')
      .eq('id', stationId)
      .single();
    
    const newStatus = !(station?.is_active ?? true);
    
    const { error } = await supabase
      .from('venue_stations')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', stationId);
    
    if (error) {
      return { success: false, isActive: newStatus, message: 'Gagal mengubah status' };
    }
    
    revalidatePath('/dashboard/owner');
    return { 
      success: true, 
      isActive: newStatus, 
      message: newStatus ? 'Stasiun diaktifkan' : 'Stasiun dinonaktifkan' 
    };
    
  } catch (error) {
    return { success: false, isActive: false, message: 'Terjadi kesalahan' };
  }
}

/**
 * Generate QR code URL for a station
 */
export async function generateStationQRCode(stationId: string): Promise<string | null> {
  const supabase = getSupabase();
  
  // Get station secret
  const { data: station } = await supabase
    .from('venue_stations')
    .select('secret_key, totp_period')
    .eq('id', stationId)
    .single();
  
  if (!station) return null;
  
  const period = station.totp_period || 30;
  const timestamp = Math.floor(Date.now() / 1000 / period);
  
  // Generate TOTP
  const encoder = new TextEncoder();
  const keyData = encoder.encode(station.secret_key + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const otp = hashHex.slice(-6).toUpperCase();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nightlife.id';
  return `${baseUrl}/checkin/${stationId}?key=${otp}&ts=${timestamp}`;
}

/**
 * Get station check-in stats
 */
export async function getStationStats(stationId: string) {
  const supabase = getSupabase();
  
  // Today's check-ins
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count: todayCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('station_id', stationId)
    .gte('timestamp', today.toISOString());
  
  // This week's check-ins
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { count: weekCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('station_id', stationId)
    .gte('timestamp', weekAgo.toISOString());
  
  // Total check-ins
  const { count: totalCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('station_id', stationId);
  
  return {
    today: todayCount || 0,
    thisWeek: weekCount || 0,
    total: totalCount || 0
  };
}

/**
 * Register NFC tag to station
 */
export async function registerNFCTag(
  stationId: string,
  nfcTagId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  
  try {
    // Check if NFC tag already registered
    const { data: existing } = await supabase
      .from('venue_stations')
      .select('id')
      .eq('nfc_tag_id', nfcTagId)
      .neq('id', stationId)
      .single();
    
    if (existing) {
      return { success: false, message: 'NFC tag sudah terdaftar ke stasiun lain' };
    }
    
    const { error } = await supabase
      .from('venue_stations')
      .update({
        nfc_tag_id: nfcTagId,
        nfc_writeable: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId);
    
    if (error) {
      return { success: false, message: 'Gagal mendaftarkan NFC tag' };
    }
    
    return { success: true, message: 'NFC tag berhasil didaftarkan' };
    
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan' };
  }
}
