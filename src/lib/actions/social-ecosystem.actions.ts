'use server';

/**
 * SOCIAL ECOSYSTEM ACTIONS - PHASE 4.4
 * AI Vibe Matching, Stories, Leaderboards, Squad Booking
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface VibeMatch {
  venue_id: string;
  venue_name: string;
  match_percentage: number;
  friends_here_count: number;
  similar_taste_count: number;
}

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string;
  expires_at: string;
  is_verified: boolean;
  view_count: number;
  user: {
    full_name: string;
    avatar_url: string | null;
    level: number;
  };
  venue: {
    name: string;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  score: number;
  badge?: string;
  is_mayor: boolean;
}

interface SquadBooking {
  id: string;
  host_user_id: string;
  host_name: string;
  venue_id: string;
  venue_name: string;
  booking_name: string;
  total_guests: number;
  max_guests: number;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  members: SquadMember[];
}

interface SquadMember {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  status: string;
  share_amount: number;
  is_paid: boolean;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. VIBE MATCHING
// ============================================

/**
 * Get venue recommendations with match percentages
 */
export async function getVibeMatches(userId: string, limit: number = 10): Promise<VibeMatch[]> {
  const supabase = getSupabase();
  
  // Get user's vibe profile
  const { data: vibeProfile } = await supabase
    .from('user_vibe_profile')
    .select('music_genres, vibe_tags')
    .eq('user_id', userId)
    .single();
  
  // Get venues with check-in data
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, music_genre, address')
    .eq('is_active', true)
    .limit(50);
  
  if (!venues) return [];
  
  // Calculate match for each venue (mock for now)
  const matches: VibeMatch[] = [];
  
  for (const venue of venues) {
    // Get friends who are here
    const { data: friendsHere } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('venue_id', venue.id)
      .eq('status', 'active')
      .in('user_id', 
        (await supabase.from('friendships').select('friend_id').eq('user_id', userId).eq('status', 'accepted')).data?.map(f => f.friend_id) || []
      );
    
    const friendsCount = friendsHere?.length || 0;
    
    // Calculate match percentage
    const matchPercentage = Math.min(100, 40 + Math.floor(Math.random() * 50) + friendsCount * 15);
    
    matches.push({
      venue_id: venue.id,
      venue_name: venue.name,
      match_percentage: matchPercentage,
      friends_here_count: friendsCount,
      similar_taste_count: Math.floor(Math.random() * 20)
    });
  }
  
  // Sort by match percentage
  return matches
    .sort((a, b) => b.match_percentage - a.match_percentage)
    .slice(0, limit);
}

/**
 * Update user vibe profile
 */
export async function updateVibeProfile(
  userId: string,
  updates: {
    music_genres?: string[];
    vibe_tags?: string[];
    preferred_group_size?: string;
    social_energy?: string;
    preferred_areas?: string[];
    max_travel_distance?: number;
  }
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('user_vibe_profile')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  revalidatePath('/profile');
  return { success: true, data };
}

// ============================================
// 2. NIGHTLIFE STORIES
// ============================================

/**
 * Get active stories for home feed
 */
export async function getActiveStories(userId: string): Promise<Story[]> {
  const supabase = getSupabase();
  
  // Get friend IDs
  const { data: friends } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'accepted');
  
  const friendIds = friends?.map(f => f.friend_id) || [];
  
  // Get active stories from friends and nearby venues
  const { data: stories, error } = await supabase
    .from('nightlife_stories')
    .select(`
      id,
      user_id,
      media_url,
      media_type,
      thumbnail_url,
      expires_at,
      is_verified,
      view_count,
      user:user_profiles(full_name, avatar_url, level),
      venue:venues(name)
    `)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .in('user_id', [...friendIds, userId])
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Stories error:', error);
    return [];
  }
  
  return (stories || []) as unknown as Story[];
}

/**
 * Create a story (from verified check-in)
 */
export async function createStory(
  userId: string,
  venueId: string,
  stationId: string,
  checkinId: string,
  mediaUrl: string,
  mediaType: 'video' | 'image' = 'video'
) {
  const supabase = getSupabase();
  
  // Verify user has active check-in at this venue
  const { data: checkin } = await supabase
    .from('checkins')
    .select('id')
    .eq('id', checkinId)
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .single();
  
  if (!checkin) {
    return { success: false, message: 'You must be checked in to post a story' };
  }
  
  // Create story with 12-hour expiry
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('nightlife_stories')
    .insert({
      user_id: userId,
      venue_id: venueId,
      station_id: stationId,
      checkin_id: checkinId,
      media_url: mediaUrl,
      media_type: mediaType,
      is_verified: true,
      expires_at: expiresAt
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  revalidatePath('/');
  return { success: true, data };
}

/**
 * Mark story as viewed
 */
export async function markStoryViewed(storyId: string, userId: string) {
  const supabase = getSupabase();
  
  // Add view record
  await supabase.from('story_views').upsert({
    story_id: storyId,
    viewer_id: userId,
    viewed_at: new Date().toISOString()
  }, { onConflict: 'story_id,viewer_id' });
  
  // Increment view count
  await supabase.rpc('increment_story_view', { story_id: storyId });
}

/**
 * Delete expired stories (cleanup)
 */
export async function cleanupExpiredStories() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('nightlife_stories')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .select();
  
  return { deleted: data?.length || 0, error };
}

// ============================================
// 3. LEADERBOARDS
// ============================================

/**
 * Get global leaderboard
 */
export async function getLeaderboard(
  type: 'top_trendsetter' | 'mayor' | 'social_magnet',
  venueId?: string,
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  
  let query = supabase
    .from('leaderboard_rankings')
    .select(`
      rank:global_rank,
      user_id,
      score,
      has_god_mode,
      user:user_profiles(full_name, avatar_url)
    `)
    .eq('ranking_type', type)
    .eq('period', 'all_time')
    .order('global_rank', { ascending: true })
    .limit(limit);
  
  if (venueId && type === 'mayor') {
    query = supabase
      .from('leaderboard_rankings')
      .select(`
        rank:local_rank,
        user_id,
        score,
        has_god_mode,
        user:user_profiles(full_name, avatar_url)
      `)
      .eq('ranking_type', type)
      .eq('venue_id', venueId)
      .eq('period', 'all_time')
      .order('local_rank', { ascending: true })
      .limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error || !data) return [];
  
  return (data as any[]).map((entry, index) => ({
    rank: index + 1,
    user_id: entry.user_id,
    user_name: (entry as any).user?.full_name || 'Anonymous',
    avatar_url: (entry as any).user?.avatar_url,
    score: entry.score,
    badge: entry.has_god_mode ? '👑' : undefined,
    is_mayor: type === 'mayor'
  }));
}

/**
 * Get user's rank
 */
export async function getUserRank(userId: string, type: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('leaderboard_rankings')
    .select('global_rank, local_rank, score, venue:venues(name)')
    .eq('user_id', userId)
    .eq('ranking_type', type)
    .single();
  
  return { data, error };
}

// ============================================
// 4. SQUAD BOOKING
// ============================================

/**
 * Create a squad booking
 */
export async function createSquadBooking(
  hostUserId: string,
  venueId: string,
  bookingData: {
    booking_name?: string;
    max_guests: number;
    booking_date: string;
    booking_time: string;
    total_amount?: number;
    deposit_amount?: number;
  }
) {
  const supabase = getSupabase();
  
  // Create booking
  const { data: booking, error } = await supabase
    .from('squad_bookings')
    .insert({
      host_user_id: hostUserId,
      venue_id: venueId,
      booking_name: bookingData.booking_name || 'Squad Night',
      max_guests: bookingData.max_guests,
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      total_amount: bookingData.total_amount || 0,
      deposit_amount: bookingData.deposit_amount || 0,
      status: 'open'
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  // Add host as first member
  await supabase.from('squad_members').insert({
    squad_id: booking.id,
    user_id: hostUserId,
    status: 'confirmed',
    share_amount: 0,
    is_paid: true
  });
  
  // Create squad chat
  await supabase.from('squad_chats').insert({
    squad_id: booking.id,
    last_message: 'Squad booking created!',
    last_message_at: new Date().toISOString()
  });
  
  revalidatePath('/bookings');
  return { success: true, data: booking };
}

/**
 * Join a squad booking
 */
export async function joinSquad(squadId: string, userId: string) {
  const supabase = getSupabase();
  
  // Check if squad is open
  const { data: squad } = await supabase
    .from('squad_bookings')
    .select('id, max_guests, total_guests, total_amount, status')
    .eq('id', squadId)
    .single();
  
  if (!squad) return { success: false, message: 'Squad not found' };
  if (squad.status !== 'open') return { success: false, message: 'Squad is no longer open' };
  if (squad.total_guests >= squad.max_guests) return { success: false, message: 'Squad is full' };
  
  // Calculate share amount
  const shareAmount = Math.ceil(squad.total_amount / (squad.total_guests + 1));
  
  // Join squad
  const { data, error } = await supabase
    .from('squad_members')
    .insert({
      squad_id: squadId,
      user_id: userId,
      status: 'confirmed',
      share_amount: shareAmount,
      is_paid: false
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  // Update squad guest count
  await supabase
    .from('squad_bookings')
    .update({ total_guests: squad.total_guests + 1 })
    .eq('id', squadId);
  
  // If full, update status
  if (squad.total_guests + 1 >= squad.max_guests) {
    await supabase
      .from('squad_bookings')
      .update({ status: 'full' })
      .eq('id', squadId);
  }
  
  revalidatePath('/bookings');
  return { success: true, data };
}

/**
 * Get squad booking details
 */
export async function getSquadDetails(squadId: string): Promise<SquadBooking | null> {
  const supabase = getSupabase();
  
  const { data: booking, error } = await supabase
    .from('squad_bookings')
    .select(`
      id,
      host_user_id,
      venue_id,
      booking_name,
      total_guests,
      max_guests,
      booking_date,
      booking_time,
      status,
      total_amount,
      host:user_profiles(full_name)
    `)
    .eq('id', squadId)
    .single();
  
  if (error || !booking) return null;
  
  // Get members
  const { data: members } = await supabase
    .from('squad_members')
    .select(`
      user_id,
      status,
      share_amount,
      is_paid,
      user:user_profiles(full_name, avatar_url)
    `)
    .eq('squad_id', squadId);
  
  return {
    id: booking.id,
    host_user_id: booking.host_user_id,
    host_name: (booking as any).host?.full_name || 'Host',
    venue_id: booking.venue_id,
    venue_name: '', // Would join with venues
    booking_name: booking.booking_name,
    total_guests: booking.total_guests,
    max_guests: booking.max_guests,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    status: booking.status,
    total_amount: booking.total_amount,
    members: (members || []).map(m => ({
      user_id: m.user_id,
      user_name: (m as any).user?.full_name || 'Member',
      avatar_url: (m as any).user?.avatar_url,
      status: m.status,
      share_amount: m.share_amount,
      is_paid: m.is_paid
    }))
  };
}

// ============================================
// 5. GHOST MODE & PRIVACY
// ============================================

/**
 * Get user privacy settings
 */
export async function getPrivacySettings(userId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ghost_mode_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Return defaults if not set
  if (!data) {
    return {
      visibility: 'all_friends',
      is_ghost_mode: false,
      stealth_checkin: false,
      share_location: true,
      show_online_status: true,
      show_checkin_history: true,
      emergency_alert_enabled: false
    };
  }
  
  return data;
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  updates: {
    visibility?: string;
    is_ghost_mode?: boolean;
    stealth_checkin?: boolean;
    share_location?: boolean;
    share_location_to?: string;
    show_online_status?: boolean;
    show_checkin_history?: boolean;
    emergency_alert_enabled?: boolean;
    emergency_contacts?: string[];
  }
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ghost_mode_settings')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  revalidatePath('/settings');
  return { success: true, data };
}

/**
 * Send emergency alert
 */
export async function sendEmergencyAlert(
  userId: string,
  message: string,
  location?: { lat: number; lng: number }
) {
  const supabase = getSupabase();
  
  // Get user's emergency contacts
  const { data: settings } = await supabase
    .from('ghost_mode_settings')
    .select('emergency_contacts')
    .eq('user_id', userId)
    .single();
  
  const contacts = settings?.emergency_contacts || [];
  
  // Create alert
  const { data: alert, error } = await supabase
    .from('emergency_alerts')
    .insert({
      user_id: userId,
      alert_type: 'panic',
      message: message || 'Emergency alert triggered',
      location_coordinates: location ? `(${location.lat},${location.lng})` : null,
      status: 'active',
      notified_contacts: contacts
    })
    .select()
    .single();
  
  if (error) return { success: false, message: error.message };
  
  // TODO: Send push notifications to contacts
  
  return { success: true, data: alert };
}

/**
 * Acknowledge emergency alert
 */
export async function acknowledgeAlert(alertId: string, userId: string) {
  const supabase = getSupabase();
  
  const { data: alert } = await supabase
    .from('emergency_alerts')
    .select('acknowledged_by')
    .eq('id', alertId)
    .single();
  
  const acknowledged = alert?.acknowledged_by || [];
  
  await supabase
    .from('emergency_alerts')
    .update({
      acknowledged_by: [...acknowledged, userId],
      status: acknowledged.length >= 2 ? 'resolved' : 'acknowledged'
    })
    .eq('id', alertId);
  
  return { success: true };
}

// ============================================
// 6. SOCIAL PROOF HELPERS
// ============================================

/**
 * Get friends at venue
 */
export async function getFriendsAtVenue(userId: string, venueId: string) {
  const supabase = getSupabase();
  
  // Get friend IDs
  const { data: friends } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'accepted');
  
  const friendIds = friends?.map(f => f.friend_id) || [];
  if (friendIds.length === 0) return [];
  
  // Get friends checked in at venue
  const { data: checkins } = await supabase
    .from('checkins')
    .select(`
      user_id,
      user:user_profiles(full_name, avatar_url, level),
      timestamp
    `)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .in('user_id', friendIds)
    .order('timestamp', { ascending: false });
  
  return checkins || [];
}

/**
 * Get similar taste users count
 */
export async function getSimilarTasteCount(userId: string, venueId: string): Promise<number> {
  const supabase = getSupabase();
  
  // Get user's vibe tags
  const { data: profile } = await supabase
    .from('user_vibe_profile')
    .select('vibe_tags')
    .eq('user_id', userId)
    .single();
  
  if (!profile?.vibe_tags?.length) return 0;
  
  // Count users with similar vibe at this venue
  // Simplified - in production would use more sophisticated matching
  const { count } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('status', 'active');
  
  return Math.floor((count || 0) * 0.3); // Estimate 30% have similar taste
}
