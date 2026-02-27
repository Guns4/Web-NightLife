'use server';

/**
 * AUTONOMOUS GROWTH ACTIONS - PHASE 5.4
 * Auto-Designer, Reputation Medic, Escrow Guardian
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Creative {
  id: string;
  venue_id: string;
  creative_type: string;
  title: string;
  media_url: string;
  status: string;
  impressions: number;
 }

interface CrisisAlert {
  id: string;
  venue_id: string;
  alert_type: string;
  severity: string;
  rating: number;
  status: string;
  created_at: string;
}

interface PeaceOffering {
  id: string;
  coupon_code: string;
  discount_percentage: number;
  status: string;
  expires_at: string;
}

interface NoShowProfile {
  user_id: string;
  no_show_score: number;
  risk_level: string;
  requires_deposit: boolean;
  deposit_percentage: number;
}

interface BookingReminder {
  id: string;
  booking_id: string;
  reminder_type: string;
  scheduled_for: string;
  status: string;
}

interface RecoveryBundle {
  id: string;
  bundle_name: string;
  discount_percentage: number;
  status: string;
}

interface VoiceQuery {
  id: string;
  transcription_text: string;
  recommended_venues: any[];
  session_completed: boolean;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. AI AUTONOMOUS AD-CREATIVE
// ============================================

/**
 * Generate auto-creative for venue
 */
export async function generateAutoCreative(
  venueId: string,
  creativeType: 'poster' | 'reel' | 'story' | 'banner'
): Promise<{ success: boolean; creative?: Creative }> {
  const supabase = getSupabase();
  
  // Get venue info
  const { data: venue } = await supabase
    .from('venues')
    .select('name, category, city, images')
    .eq('id', venueId)
    .single();
  
  if (!venue) return { success: false };
  
  // Get active promos
  const { data: promos } = await supabase
    .from('promos')
    .select('title, description')
    .eq('venue_id', venueId)
    .eq('is_active', true);
  
  // Mock AI generation (would use image generation API in production)
  const mockPromo = promos?.[0]?.title || 'Special Offer';
  
  const { data: creative, error } = await supabase
    .from('auto_generated_creatives')
    .insert({
      venue_id: venueId,
      creative_type: creativeType,
      title: `${venue.name} - ${mockPromo}`,
      description: `AI-generated ${creativeType} for ${venue.name}`,
      media_url: venue.images?.[0] || '',
      media_type: creativeType === 'reel' ? 'video' : 'image',
      promo_text: mockPromo,
      music_track: getMusicForCategory(venue.category),
      dimensions: creativeType === 'story' ? '1080x1920' : '1080x1080',
      status: 'ready'
    })
    .select()
    .single();
  
  if (error) return { success: false };
  
  // Log autonomous action
  await logAIAction('creative_generated', 'marketing', 'threshold', 'venue', venueId, {
    creative_type: creativeType,
    title: creative?.title
  });
  
  return { success: true, creative };
}

/**
 * Get music track for venue category
 */
function getMusicForCategory(category: string): string {
  const tracks: Record<string, string> = {
    club: 'Upbeat House Mix',
    karaoke: 'Karaoke Classics',
    ktv: 'Mandopop Hits',
    spa: 'Chill Ambient'
  };
  return tracks[category] || 'Curated Vibes';
}

/**
 * Get venue creatives
 */
export async function getVenueCreatives(venueId: string): Promise<Creative[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('auto_generated_creatives')
    .select('*')
    .eq('venue_id', venueId)
    .order('generated_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Activate creative (serve to users)
 */
export async function activateCreative(creativeId: string): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('auto_generated_creatives')
    .update({
      status: 'active',
      activated_at: new Date().toISOString()
    })
    .eq('id', creativeId);
  
  return { success: true };
}

// ============================================
// 2. SENTIMENT RECOVERY PROTOCOL
// ============================================

/**
 * Handle negative review and trigger recovery
 */
export async function handleNegativeReview(
  venueId: string,
  reviewId: string,
  userId: string,
  rating: number,
  reviewText: string,
  source: string = 'vibe_check'
): Promise<{ success: boolean; alert?: CrisisAlert; offering?: PeaceOffering }> {
  const supabase = getSupabase();
  
  // Only trigger for ratings below 3
  if (rating >= 3) {
    return { success: false };
  }
  
  // Determine severity
  const severity = rating === 1 ? 'critical' : rating === 2 ? 'high' : 'medium';
  
  // Generate coupon code
  const couponCode = `RESCUE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const discount = rating === 1 ? 25 : 20;
  
  // Create crisis alert
  const { data: alert, error: alertError } = await supabase
    .from('crisis_alerts')
    .insert({
      venue_id: venueId,
      review_id: reviewId,
      user_id: userId,
      alert_type: 'negative_review',
      severity,
      rating,
      review_text: reviewText,
      review_source: source
    })
    .select()
    .single();
  
  if (alertError) return { success: false };
  
  // Create peace offering
  const { data: offering, error: offeringError } = await supabase
    .from('peace_offering_coupons')
    .insert({
      crisis_alert_id: alert.id,
      venue_id: venueId,
      user_id: userId,
      coupon_code: couponCode,
      discount_percentage: discount,
      valid_hours: 48,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  
  if (offeringError) return { success: false, alert };
  
  // Log autonomous action
  await logAIAction('peace_offering_generated', 'recovery', 'threshold', 'user', userId, {
    rating,
    discount,
    coupon_code: couponCode
  }, venueId);
  
  return { success: true, alert, offering };
}

/**
 * Get crisis alerts for venue
 */
export async function getCrisisAlerts(venueId: string): Promise<CrisisAlert[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('crisis_alerts')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Resolve crisis alert
 */
export async function resolveCrisisAlert(
  alertId: string,
  resolutionType: 'discount_sent' | 'personal_reach' | 'no_action',
  notes?: string
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('crisis_alerts')
    .update({
      status: 'resolved',
      resolution_type: resolutionType,
      resolution_notes: notes,
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId);
  
  return { success: true };
}

/**
 * Get user's peace offerings
 */
export async function getUserPeaceOfferings(userId: string): Promise<PeaceOffering[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('peace_offering_coupons')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'sent')
    .gt('expires_at', new Date().toISOString());
  
  if (error) return [];
  return data || [];
}

/**
 * Use peace offering coupon
 */
export async function usePeaceOffering(couponCode: string): Promise<{ success: boolean; discount?: number }> {
  const supabase = getSupabase();
  
  const { data: coupon } = await supabase
    .from('peace_offering_coupons')
    .select('*')
    .eq('coupon_code', couponCode)
    .single();
  
  if (!coupon || coupon.status !== 'sent') {
    return { success: false };
  }
  
  if (new Date(coupon.expires_at) < new Date()) {
    return { success: false };
  }
  
  // Mark as used
  await supabase
    .from('peace_offering_coupons')
    .update({
      status: 'used',
      used_at: new Date().toISOString()
    })
    .eq('id', coupon.id);
  
  return { success: true, discount: coupon.discount_percentage };
}

// ============================================
// 3. DYNAMIC REVENUE PROTECTION (NO-SHOW PREDICTOR)
// ============================================

/**
 * Get user's no-show risk profile
 */
export async function getNoShowRiskProfile(userId: string): Promise<NoShowProfile | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('no_show_risk_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    // Calculate initial profile
    return await calculateNoShowRisk(userId);
  }
  
  return {
    user_id: data.user_id,
    no_show_score: data.no_show_score,
    risk_level: data.risk_level,
    requires_deposit: data.requires_deposit,
    deposit_percentage: data.deposit_percentage
  };
}

/**
 * Calculate no-show risk score
 */
export async function calculateNoShowRisk(userId: string): Promise<NoShowProfile> {
  const supabase = getSupabase();
  
  // Get booking history
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('user_id', userId);
  
  const total = bookings?.length || 0;
  const noShows = bookings?.filter(b => b.status === 'no_show').length || 0;
  const cancellations = bookings?.filter(b => b.status === 'cancelled').length || 0;
  
  // Calculate risk score
  let riskScore = 0;
  if (total > 0) {
    riskScore = Math.round(
      (noShows / total) * 50 +
      (cancellations / total) * 30 +
      (noShows > 2 ? 20 : 0)
    );
  }
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const requiresDeposit = riskLevel === 'high';
  
  // Upsert profile
  await supabase
    .from('no_show_risk_profiles')
    .upsert({
      user_id: userId,
      no_show_score: riskScore,
      risk_level: riskLevel,
      total_bookings: total,
      completed_bookings: total - noShows - cancellations,
      no_show_count: noShows,
      cancellation_count: cancellations,
      requires_deposit: requiresDeposit,
      deposit_percentage: requiresDeposit ? 50 : 0,
      updated_at: new Date().toISOString()
    });
  
  return {
    user_id: userId,
    no_show_score: riskScore,
    risk_level: riskLevel,
    requires_deposit: requiresDeposit,
    deposit_percentage: requiresDeposit ? 50 : 0
  };
}

/**
 * Create booking with deposit if required
 */
export async function createBookingWithDeposit(
  userId: string,
  venueId: string,
  bookingData: {
    booking_time: string;
    party_size: number;
    total_value: number;
  }
): Promise<{ success: boolean; booking_id?: string; requires_deposit: boolean; deposit_amount?: number }> {
  const supabase = getSupabase();
  
  // Check no-show risk
  const riskProfile = await getNoShowRiskProfile(userId);
  const requiresDeposit = riskProfile?.requires_deposit || false;
  
  // Create booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      venue_id: venueId,
      booking_time: bookingData.booking_time,
      party_size: bookingData.party_size,
      total_amount: bookingData.total_value,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) return { success: false, requires_deposit: false };
  
  // Create deposit requirement if high risk
  if (requiresDeposit && booking) {
    const depositAmount = Math.round(bookingData.total_value * 0.5);
    
    await supabase
      .from('booking_deposit_requirements')
      .insert({
        booking_id: booking.id,
        user_id: userId,
        venue_id: venueId,
        deposit_amount: depositAmount,
        deposit_percentage: 50,
        total_booking_value: bookingData.total_value,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min to pay
      });
    
    // Schedule reminders
    await scheduleReminders(booking.id, userId, bookingData.booking_time);
  }
  
  return {
    success: true,
    booking_id: booking?.id,
    requires_deposit: requiresDeposit,
    deposit_amount: requiresDeposit ? Math.round(bookingData.total_value * 0.5) : 0
  };
}

/**
 * Schedule booking reminders
 */
async function scheduleReminders(bookingId: string, userId: string, bookingTime: string) {
  const supabase = getSupabase();
  const bookingDate = new Date(bookingTime);
  
  const reminders = [
    { type: 'reminder_3h', offset: 3 * 60 * 60 * 1000, msg: 'Hey! Your booking is in 3 hours. See you soon! 👋' },
    { type: 'reminder_1h', offset: 60 * 60 * 1000, msg: '⌛ 1 hour until your reservation!' },
    { type: 'reminder_30m', offset: 30 * 60 * 1000, msg: '🚪 Almost time! We have your table ready.' }
  ];
  
  for (const reminder of reminders) {
    const scheduledFor = new Date(bookingDate.getTime() - reminder.offset);
    if (scheduledFor > new Date()) {
      await supabase
        .from('booking_reminders')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          reminder_type: reminder.type,
          scheduled_for: scheduledFor.toISOString(),
          message_text: reminder.msg
        });
    }
  }
}

/**
 * Get booking reminders for user
 */
export async function getBookingReminders(userId: string): Promise<BookingReminder[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('booking_reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });
  
  if (error) return [];
  return data || [];
}

// ============================================
// 4. CROSS-NETWORK SYNDICATE
// ============================================

/**
 * Get active recovery bundles
 */
export async function getActiveRecoveryBundles(userId: string): Promise<RecoveryBundle[]> {
  const supabase = getSupabase();
  
  // Get user's recent venue visits
  const { data: recentVisits } = await supabase
    .from('checkins')
    .select('venue_id, venue:venues(category)')
    .eq('user_id', userId)
    .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(5);
  
  if (!recentVisits || recentVisits.length === 0) return [];
  
  const categories = recentVisits.map(v => (v.venue as any)?.category).filter(Boolean);
  
  const { data: bundles, error } = await supabase
    .from('recovery_bundles')
    .select('*')
    .eq('status', 'active')
    .contains('target_user_segments', categories)
    .gte('expires_at', new Date().toISOString());
  
  if (error) return [];
  return bundles || [];
}

/**
 * Detect user journey patterns
 */
export async function detectJourneyPattern(
  userId: string,
  currentVenueId: string
): Promise<{ detected: boolean; bundles_sent: number }> {
  const supabase = getSupabase();
  
  // Get current venue category
  const { data: venue } = await supabase
    .from('venues')
    .select('category')
    .eq('id', currentVenueId)
    .single();
  
  if (!venue) return { detected: false, bundles_sent: 0 };
  
  // Find matching journey patterns
  const { data: patterns } = await supabase
    .from('user_journey_patterns')
    .select('*')
    .eq('source_venue_category', venue.category)
    .eq('is_active', true);
  
  if (!patterns || patterns.length === 0) return { detected: false, bundles_sent: 0 };
  
  // Simplified: just return detected (would send notifications in production)
  return { detected: true, bundles_sent: patterns.length };
}

// ============================================
// 5. VOICE-ACTIVATED VIBE SEARCH
// ============================================

/**
 * Process voice query
 */
export async function processVoiceQuery(
  userId: string | null,
  audioUrl: string,
  transcription: string
): Promise<{ success: boolean; query?: VoiceQuery }> {
  const supabase = getSupabase();
  
  // Analyze transcription (mock - would use speech-to-text and NLP in production)
  const preferences = analyzeVoicePreferences(transcription);
  const intent = detectVoiceIntent(transcription);
  
  // Get venue recommendations
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, category, price_range, rating, city')
    .eq('is_active', true)
    .ilike('city', `%${preferences.location || 'jakarta'}%`)
    .order('rating', { ascending: false })
    .limit(3);
  
  const recommendations = venues?.map(v => ({
    venue_id: v.id,
    name: v.name,
    category: v.category,
    reason: `Matches your ${preferences.music || 'vibe'} preference`
  })) || [];
  
  // Generate response
  const responseText = generateVoiceResponse(preferences, recommendations);
  
  // Save session
  const { data: query, error } = await supabase
    .from('voice_query_sessions')
    .insert({
      user_id: userId,
      audio_url: audioUrl,
      transcription_text: transcription,
      analyzed_intent: intent,
      sentiment_score: 0.5, // Would analyze
      extracted_preferences: preferences,
      response_text: responseText,
      recommended_venues: recommendations,
      session_completed: true,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) return { success: false };
  
  return { success: true, query };
}

/**
 * Analyze voice preferences from text
 */
function analyzeVoicePreferences(text: string): Record<string, any> {
  const lower = text.toLowerCase();
  const preferences: Record<string, any> = {};
  
  if (lower.includes('rnb') || lower.includes('r&b')) preferences.music = 'rnb';
  else if (lower.includes('house') || lower.includes('edm')) preferences.music = 'electronic';
  else if (lower.includes('jazz') || lower.includes('live')) preferences.music = 'live music';
  else if (lower.includes('indo') || lower.includes('melayu')) preferences.music = 'indo';
  
  if (lower.includes('cewek') || lower.includes('girl') || lower.includes('party')) preferences.vibe = 'social';
  if (lower.includes('chill') || lower.includes('relax')) preferences.vibe = 'chill';
  
  const budgetMatch = lower.match(/(\d+)\s*(jt|juta)/);
  if (budgetMatch) preferences.budget = parseInt(budgetMatch[1]) * 1000000;
  
  const locationMatch = lower.match(/(di|dekat|tiap)\s+(\w+)/);
  if (locationMatch) preferences.location = locationMatch[2];
  
  return preferences;
}

/**
 * Detect voice intent
 */
function detectVoiceIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('book') || lower.includes('reserv')) return 'book_table';
  if (lower.includes('cari') || lower.includes('find') || lower.includes('carikan')) return 'find_venue';
  if (lower.includes('promo') || lower.includes('diskon')) return 'get_promo';
  return 'find_venue';
}

/**
 * Generate voice response
 */
function generateVoiceResponse(preferences: any, venues: any[]): string {
  if (venues.length === 0) {
    return "Maaf, saya tidak menemukan venue yang cocok dengan preferensi kamu. Coba lagi ya!";
  }
  
  const topVenue = venues[0];
  return `Saya menemukan ${venues.length} tempat yang cocok! Rekomendasi utama: ${topVenue.name}. Mau booking sekarang?`;
}

// ============================================
// 6. ACTIVITY AUDIT LOG
// ============================================

/**
 * Log AI autonomous action
 */
async function logAIAction(
  actionType: string,
  actionCategory: string,
  triggeredBy: string,
  targetType: string,
  targetId: string,
  actionDetails: Record<string, any>,
  ownerId?: string
) {
  const supabase = getSupabase();
  
  await supabase
    .from('ai_activity_audit_log')
    .insert({
      action_type: actionType,
      action_category: actionCategory,
      triggered_by: triggeredBy,
      target_type: targetType,
      target_id: targetId,
      action_details: actionDetails,
      owner_id: ownerId
    });
}

/**
 * Get audit log for venue
 */
export async function getAuditLog(venueId: string, limit: number = 50) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ai_activity_audit_log')
    .select('*')
    .eq('owner_id', venueId) // Simplified - would be owner_id
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) return [];
  return data || [];
}

/**
 * Get audit log summary
 */
export async function getAuditLogSummary(venueId: string) {
  const supabase = getSupabase();
  
  // Get counts by action type
  const { data } = await supabase
    .from('ai_activity_audit_log')
    .select('action_type')
    .eq('owner_id', venueId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  const summary: Record<string, number> = {};
  (data || []).forEach(item => {
    summary[item.action_type] = (summary[item.action_type] || 0) + 1;
  });
  
  return summary;
}
