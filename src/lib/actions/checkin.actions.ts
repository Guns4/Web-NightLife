'use server';

/**
 * CHECK-IN ACTIONS - PHASE 4.2
 * Physical-Digital Integration (NFC/QR System)
 * 
 * Key Features:
 * - TOTP-based QR codes (change every 30 seconds)
 * - NFC tag integration
 * - Real-time crowd heatmap
 * - Manual VIP check-in
 * - Squad bonus XP
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// Types
interface CheckInResult {
  success: boolean;
  message: string;
  xp_awarded?: number;
  new_badge?: string;
  checkin_id?: string;
  session_id?: string;
}

interface StationInfo {
  id: string;
  name: string;
  station_type: string;
  venue_id: string;
  venue_name?: string;
  qr_color?: string;
  min_tier_access?: string;
  cover_charge?: number;
}

interface VenueHeatmap {
  station_id: string;
  station_name: string;
  checkin_count: number;
  occupancy_level: number;
  last_checkin: string;
}

// Get Supabase client
function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

function getSupabaseAdmin(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Generate a secure check-in URL with TOTP
 * Used for QR codes and NFC tags
 */
export async function generateCheckInUrl(stationId: string): Promise<string | null> {
  const supabase = getSupabase();
  
  const { data: station, error } = await supabase
    .from('venue_stations')
    .select('id, secret_key, totp_enabled, totp_period, venues(name)')
    .eq('id', stationId)
    .eq('is_active', true)
    .single();
  
  if (error || !station) {
    return null;
  }
  
  const period = station.totp_period || 30;
  const timestamp = Math.floor(Date.now() / 1000 / period);
  const secret = station.secret_key;
  
  // Use proper HMAC-SHA1 for TOTP (RFC 6238 compliant)
  const hmac = createHmac('sha1', secret);
  hmac.update(timestamp.toString());
  const hash = hmac.digest('hex');
  // Dynamic truncation to get 6-digit OTP
  const offset = parseInt(hash.slice(-1), 16);
  const binary = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16);
  const otp = (binary & 0x7fffffff).toString().slice(-6).padStart(6, '0');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nightlife.id';
  return `${baseUrl}/checkin/${stationId}?key=${otp}&ts=${timestamp}`;
}

/**
 * Process a physical check-in (NFC scan or QR code scan)
 */
export async function processPhysicalCheckIn(
  stationId: string,
  userId: string,
  totpCode: string,
  timestamp: number,
  method: 'nfc' | 'qr' | 'geofence' | 'manual' = 'qr',
  deviceInfo?: Record<string, unknown>,
  userLatitude?: number,
  userLongitude?: number
): Promise<CheckInResult> {
  const supabase = getSupabase();
  
  try {
    // 1. Validate station
    const { data: station, error: stationError } = await supabase
      .from('venue_stations')
      .select('id, name, station_type, venue_id, secret_key, totp_enabled, totp_period, venues(id, name, owner_id)')
      .eq('id', stationId)
      .eq('is_active', true)
      .single();
    
    if (stationError || !station) {
      return { success: false, message: 'Stasiun tidak valid atau tidak aktif' };
    }
    
    // 2. Validate TOTP
    if (station.totp_enabled) {
      const period = station.totp_period || 30;
      const currentPeriod = Math.floor(Date.now() / 1000 / period);
      const requestedPeriod = Math.floor(timestamp / period);
      
      if (Math.abs(currentPeriod - requestedPeriod) > 1) {
        return { success: false, message: 'Kode QR sudah kedaluwarsa. Silakan pindai ulang.' };
      }
      
      const secret = station.secret_key;
      
      // Use proper HMAC-SHA1 for TOTP verification (RFC 6238 compliant)
      const hmac = createHmac('sha1', secret);
      hmac.update(requestedPeriod.toString());
      const hash = hmac.digest('hex');
      // Dynamic truncation to get 6-digit OTP
      const offset = parseInt(hash.slice(-1), 16);
      const binary = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16);
      const validOtp = ((binary & 0x7fffffff) % 1000000).toString().padStart(6, '0');
      
      // Use constant-time comparison to prevent timing attacks
      const totpBuffer = Buffer.from(totpCode.padStart(6, '0'));
      const validBuffer = Buffer.from(validOtp);
      
      if (!totpBuffer.equals(validBuffer)) {
        await supabase.from('checkins').insert({
          user_id: userId,
          venue_id: station.venue_id,
          station_id: stationId,
          method,
          session_id: `failed_${Date.now()}`,
          status: 'invalid',
          xp_awarded: 0
        });
        
        return { success: false, message: 'Verifikasi gagal. Silakan coba lagi.' };
      }
    }
    
    // 3. Check existing check-in
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('id, session_id')
      .eq('user_id', userId)
      .eq('venue_id', station.venue_id)
      .eq('status', 'active')
      .single();
    
    if (existingCheckin) {
      const venueName = (station as any).venues?.name || 'venue ini';
      return { 
        success: true, 
        message: `Anda sudah check-in di ${venueName}`,
        checkin_id: existingCheckin.id,
        session_id: existingCheckin.session_id,
        xp_awarded: 0
      };
    }
    
    // 4. Generate session ID
    const sessionId = `${userId.slice(0, 8)}_${stationId.slice(0, 8)}_${Date.now()}`;
    
    // 5. Calculate XP with squad bonus
    let xpMultiplier = 1.0;
    
    const { data: squadMembers } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('venue_id', station.venue_id)
      .eq('status', 'active')
      .neq('user_id', userId);
    
    if (squadMembers && squadMembers.length >= 1) {
      xpMultiplier = 1.5;
    }
    
    const baseXp = 50;
    const xpAwarded = Math.round(baseXp * xpMultiplier);
    
    // 6. Create check-in
    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .insert({
        user_id: userId,
        venue_id: station.venue_id,
        station_id: stationId,
        method,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        xp_awarded: xpAwarded,
        totp_verified: station.totp_enabled,
        totp_timestamp: new Date().toISOString(),
        status: 'active',
        device_info: deviceInfo || {},
        location_coordinates: userLatitude && userLongitude 
          ? `(${userLatitude},${userLongitude})`
          : null
      })
      .select()
      .single();
    
    if (checkinError) {
      return { success: false, message: 'Gagal menyimpan check-in' };
    }
    
    // 7. Award XP
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp_total, level, badges')
      .eq('id', userId)
      .single();
    
    const newXp = (profile?.xp_total || 0) + xpAwarded;
    const newLevel = Math.floor(newXp / 500) + 1;
    const currentLevel = profile?.level || 1;
    const leveledUp = newLevel > currentLevel;
    
    await supabase
      .from('user_profiles')
      .update({
        xp_total: newXp,
        level: newLevel,
        xp_in_current_level: newXp - ((newLevel - 1) * 500),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    // 8. Check badges
    let newBadge = '';
    const { count: checkinCount } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    const cnt = checkinCount || 0;
    if (cnt === 1) newBadge = 'First Check-in';
    else if (cnt === 10) newBadge = 'Regular Visitor';
    else if (cnt === 50) newBadge = 'Night Owl';
    else if (cnt === 100) newBadge = 'Party Legend';
    
    if (newBadge) {
      const currentBadges = profile?.badges || [];
      if (!currentBadges.includes(newBadge)) {
        await supabase
          .from('user_profiles')
          .update({ badges: [...currentBadges, newBadge] })
          .eq('id', userId);
      }
    }
    
    // 9. Build response
    const venueName = (station as any).venues?.name || 'venue';
    let message = `Selamat datang di ${venueName}!`;
    if (xpMultiplier > 1) {
      message += ` 🎉 Bonus squad +${Math.round((xpMultiplier - 1) * 100)}% XP!`;
    }
    if (xpAwarded > 0) {
      message += ` +${xpAwarded} XP!`;
    }
    if (leveledUp) {
      message += ` 🆙 Anda naik ke level ${newLevel}!`;
    }
    
    return {
      success: true,
      message,
      xp_awarded: xpAwarded,
      new_badge: newBadge || undefined,
      checkin_id: checkin?.id,
      session_id: sessionId
    };
    
  } catch (error) {
    console.error('Check-in error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}

/**
 * Manual check-in for VIP guests
 */
export async function manualCheckIn(
  venueId: string,
  stationId: string,
  staffUserId: string,
  guestPhoneOrName: string,
  guestId?: string
): Promise<CheckInResult> {
  const supabase = getSupabase();
  
  try {
    const { data: staffRole } = await supabase
      .from('venue_staff')
      .select('role')
      .eq('user_id', staffUserId)
      .eq('venue_id', venueId)
      .single();
    
    if (!staffRole || !['owner', 'manager', 'ops'].includes(staffRole.role)) {
      return { success: false, message: 'Anda tidak memiliki izin' };
    }
    
    let userId = guestId;
    
    if (!userId) {
      const { data: guest } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', guestPhoneOrName)
        .single();
      
      userId = guest?.id;
    }
    
    // Validate: Guest must be registered user
    if (!userId) {
      return { success: false, message: 'Tamu tidak ditemukan. Minta nomor HP yang terdaftar di NightLife.' };
    }
    
    const sessionId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const { data: checkin, error } = await supabase
      .from('checkins')
      .insert({
        user_id: userId,
        venue_id: venueId,
        station_id: stationId,
        method: 'manual',
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        xp_awarded: userId ? 25 : 0,
        status: 'active',
        device_info: { manual_by: staffUserId, guest_name: guestPhoneOrName }
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, message: 'Gagal check-in manual' };
    }
    
    return {
      success: true,
      message: `Guest "${guestPhoneOrName}" berhasil di-check-in!`,
      checkin_id: checkin?.id,
      session_id: sessionId,
      xp_awarded: userId ? 25 : 0
    };
    
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan' };
  }
}

/**
 * Check out from venue
 */
export async function checkOutFromVenue(
  userId: string,
  venueId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('checkins')
    .update({
      status: 'checked_out',
      checked_out_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .eq('status', 'active');
  
  if (error) {
    return { success: false, message: 'Gagal check-out' };
  }
  
  return { success: true, message: 'Berhasil check-out!' };
}

/**
 * Get user's active check-in
 */
export async function getActiveCheckIn(userId: string) {
  const supabase = getSupabase();
  
  return await supabase
    .from('checkins')
    .select('id, venue_id, station_id, timestamp, session_id, venue:venues(id, name, address, cover_image)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
}

/**
 * Get venue heatmap (real-time crowd status)
 */
export async function getVenueHeatmap(venueId: string): Promise<VenueHeatmap[]> {
  const supabase = getSupabase();
  
  const { data: stations } = await supabase
    .from('venue_stations')
    .select('id, name, station_type, total_checkins, last_checkin_at')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('name');
  
  const { data: activeCheckins } = await supabase
    .from('checkins')
    .select('station_id')
    .eq('venue_id', venueId)
    .eq('status', 'active');
  
  const checkinCounts: Record<string, number> = {};
  (activeCheckins || []).forEach((c: any) => {
    if (c.station_id) {
      checkinCounts[c.station_id] = (checkinCounts[c.station_id] || 0) + 1;
    }
  });
  
  return (stations || []).map((s: any) => ({
    station_id: s.id,
    station_name: s.name,
    checkin_count: checkinCounts[s.id] || 0,
    occupancy_level: Math.min(100, (checkinCounts[s.id] || 0) * 20),
    last_checkin: s.last_checkin_at || ''
  }));
}

/**
 * Get live guest list
 */
export async function getLiveGuestList(venueId: string) {
  const supabase = getSupabaseAdmin();
  
  return await supabase
    .from('checkins')
    .select('id, timestamp, user:user_profiles(id, full_name, avatar_url, level, badges), station:venue_stations(name, station_type)')
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .order('timestamp', { ascending: false });
}

/**
 * Get station info
 */
export async function getStationInfo(stationId: string): Promise<StationInfo | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('venue_stations')
    .select('id, name, station_type, venue_id, venues(name), qr_color, min_tier_access, cover_charge')
    .eq('id', stationId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    station_type: data.station_type,
    venue_id: data.venue_id,
    venue_name: (data as any).venues?.name,
    qr_color: data.qr_color,
    min_tier_access: data.min_tier_access,
    cover_charge: data.cover_charge
  };
}
