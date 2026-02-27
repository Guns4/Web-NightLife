'use server';

/**
 * FRAUD PREVENTION ACTIONS - PHASE 5.3
 * AI Anti-Fraud Shield, Revenue Matcher, Ops-Intelligence
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface TrustScore {
  user_id: string;
  trust_score: number;
  trust_level: string;
  identity_verification_score: number;
  risk_flags: string[];
}

interface FraudDetection {
  id: string;
  review_id: string;
  fraud_score: number;
  is_suspicious: boolean;
  detection_reasons: string[];
  ai_decision: string;
}

interface TransactionAnomaly {
  id: string;
  venue_id: string;
  anomaly_type: string;
  anomaly_score: number;
  checkin_duration_minutes: number;
  invoice_amount: number;
  expected_minimum_amount: number;
  status: string;
}

interface StaffingRecommendation {
  id: string;
  venue_id: string;
  target_date: string;
  predicted_occupancy_percentage: number;
  recommended_security: number;
  recommended_bar_staff: number;
  recommended_hosts: number;
  ai_reasoning: string;
}

interface ReengagementCampaign {
  id: string;
  user_id: string;
  campaign_type: string;
  discount_percentage: number;
  personalized_message: string;
  favorite_venue_name: string;
  status: string;
  expires_at: string;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. AI ANTI-FRAUD SHIELD
// ============================================

/**
 * Get user's trust score
 */
export async function getUserTrustScore(userId: string): Promise<TrustScore | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('user_trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  
  return {
    user_id: data.user_id,
    trust_score: data.trust_score,
    trust_level: data.trust_level,
    identity_verification_score: data.identity_verification_score,
    risk_flags: data.risk_flags || []
  };
}

/**
 * Verify user identity (NFC/QR Proof)
 */
export async function verifyUserIdentity(
  userId: string,
  verificationMethod: 'nfc' | 'qr'
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  // Get current trust score
  const { data: current } = await supabase
    .from('user_trust_scores')
    .select('identity_verification_score')
    .eq('user_id', userId)
    .single();
  
  const newScore = Math.min(100, (current?.identity_verification_score || 0) + 30);
  
  // Update trust score
  await supabase
    .from('user_trust_scores')
    .upsert({
      user_id: userId,
      identity_verification_score: newScore,
      is_identity_verified: true,
      verification_method: verificationMethod,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  return { success: true };
}

/**
 * Detect review fraud
 */
export async function detectReviewFraud(
  reviewId: string,
  venueId: string,
  userId: string,
  reviewText: string
): Promise<{ success: boolean; detection?: FraudDetection }> {
  const supabase = getSupabase();
  
  // Simple fraud detection (would use ML in production)
  const suspiciousPatterns = ['best club ever', 'amazing place', 'great experience'];
  const isIdentical = suspiciousPatterns.some(p => 
    reviewText.toLowerCase().includes(p.toLowerCase())
  );
  
  // Check for velocity (multiple reviews same day)
  const { count } = await supabase
    .from('vibe_checks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('created_at', new Date().toISOString().split('T')[0]);
  
  const isVelocityAnomaly = (count || 0) > 5;
  
  const isSuspicious = isIdentical || isVelocityAnomaly;
  const fraudScore = isSuspicious ? 0.8 : 0.1;
  
  const reasons: string[] = [];
  if (isIdentical) reasons.push('bot_pattern');
  if (isVelocityAnomaly) reasons.push('velocity_anomaly');
  
  // Store detection result
  const { data, error } = await supabase
    .from('review_fraud_detection')
    .insert({
      review_id: reviewId,
      review_type: 'vibe_check',
      venue_id: venueId,
      user_id: userId,
      fraud_score: fraudScore,
      is_suspicious: isSuspicious,
      detection_reasons: reasons,
      text_similarity_score: isIdentical ? 1.0 : 0.0,
      reviews_same_day: count || 0,
      ai_decision: isSuspicious ? 'flagged' : 'approved',
      ai_confidence: 0.9,
      status: isSuspicious ? 'pending' : 'approved'
    })
    .select()
    .single();
  
  return { success: !error, detection: data };
}

/**
 * Get flagged reviews for admin review
 */
export async function getFlaggedReviews(): Promise<FraudDetection[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('review_fraud_detection')
    .select('*')
    .eq('status', 'pending')
    .order('fraud_score', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Restore suspicious review (after NFC/QR proof)
 */
export async function restoreReview(
  reviewId: string,
  restorationMethod: 'nfc_proof' | 'qr_proof' | 'manual_review'
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  // Update review status
  await supabase
    .from('review_fraud_detection')
    .update({
      status: 'restored',
      restoration_method: restorationMethod,
      restored_at: new Date().toISOString()
    })
    .eq('review_id', reviewId);
  
  return { success: true };
}

// ============================================
// 2. AUTOMATED COMMISSION RECONCILIATION
// ============================================

/**
 * Check for transaction anomalies
 */
export async function checkTransactionAnomaly(
  checkinId: string,
  invoiceId: string
): Promise<{ isAnomaly: boolean; anomaly?: TransactionAnomaly }> {
  const supabase = getSupabase();
  
  // Get check-in duration
  const { data: checkin } = await supabase
    .from('checkins')
    .select('venue_id, user_id, started_at, ended_at')
    .eq('id', checkinId)
    .single();
  
  if (!checkin) return { isAnomaly: false };
  
  const duration = checkin.ended_at 
    ? (new Date(checkin.ended_at).getTime() - new Date(checkin.started_at).getTime()) / 60000
    : 0;
  
  // Get invoice amount
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('id', invoiceId)
    .single();
  
  const amount = invoice?.total_amount || 0;
  const minExpected = Math.max(50000, Math.floor(duration / 60) * 50000);
  
  const isAnomaly = (amount === 0 && duration > 60) || (amount < minExpected * 0.1);
  
  if (!isAnomaly) return { isAnomaly: false };
  
  // Create anomaly record
  const { data: anomaly } = await supabase
    .from('transaction_anomalies')
    .insert({
      checkin_id: checkinId,
      invoice_id: invoiceId,
      venue_id: checkin.venue_id,
      user_id: checkin.user_id,
      anomaly_type: amount === 0 ? 'zero_invoice' : 'low_amount',
      anomaly_score: 0.8,
      checkin_duration_minutes: Math.floor(duration),
      invoice_amount: amount,
      expected_minimum_amount: minExpected,
      amount_difference: minExpected - amount
    })
    .select()
    .single();
  
  return { isAnomaly: true, anomaly };
}

/**
 * Get transaction anomalies for venue
 */
export async function getTransactionAnomalies(venueId: string): Promise<TransactionAnomaly[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('transaction_anomalies')
    .select('*')
    .eq('venue_id', venueId)
    .order('detected_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Resolve transaction anomaly
 */
export async function resolveTransactionAnomaly(
  anomalyId: string,
  resolution: 'confirmed' | 'false_positive',
  notes?: string
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('transaction_anomalies')
    .update({
      status: resolution === 'confirmed' ? 'resolved' : 'false_positive',
      resolution_notes: notes,
      resolved_at: new Date().toISOString()
    })
    .eq('id', anomalyId);
  
  return { success: true };
}

/**
 * Get commission reconciliation for venue
 */
export async function getCommissionReconciliation(
  venueId: string,
  startDate: string,
  endDate: string
) {
  const supabase = getSupabase();
  
  // Get all invoices in period
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, status')
    .eq('venue_id', venueId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const totalCollected = invoices
    ?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  
  // Get anomalies
  const { data: anomalies } = await supabase
    .from('transaction_anomalies')
    .select('id')
    .eq('venue_id', venueId)
    .gte('detected_at', startDate)
    .lte('detected_at', endDate)
    .eq('status', 'detected');
  
  return {
    period_start: startDate,
    period_end: endDate,
    total_invoiced: totalInvoiced,
    total_collected: totalCollected,
    expected_commission: Math.floor(totalCollected * 0.05),
    anomaly_count: anomalies?.length || 0
  };
}

// ============================================
// 3. STAFFING & SUPPLY SUGGESTIONS
// ============================================

/**
 * Get staffing recommendations for venue
 */
export async function getStaffingRecommendations(
  venueId: string,
  targetDate: string
): Promise<StaffingRecommendation | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('venue_staffing_recommendations')
    .select('*')
    .eq('venue_id', venueId)
    .eq('target_date', targetDate)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    venue_id: data.venue_id,
    target_date: data.target_date,
    predicted_occupancy_percentage: data.predicted_occupancy_percentage,
    recommended_security: data.recommended_security,
    recommended_bar_staff: data.recommended_bar_staff,
    recommended_hosts: data.recommended_hosts,
    ai_reasoning: data.ai_reasoning
  };
}

/**
 * Generate weekly staffing report
 */
export async function generateWeeklyStaffingReport(venueId: string) {
  const supabase = getSupabase();
  
  // Get next Saturday prediction
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
  const saturdayStr = nextSaturday.toISOString().split('T')[0];
  
  // Check if recommendation exists
  const existing = await getStaffingRecommendations(venueId, saturdayStr);
  
  if (existing) {
    return existing;
  }
  
  // Get occupancy prediction
  const { data: prediction } = await supabase
    .from('venue_occupancy_predictions')
    .select('predicted_occupancy')
    .eq('venue_id', venueId)
    .gte('prediction_time', saturdayStr)
    .order('predicted_occupancy', { ascending: false })
    .limit(1)
    .single();
  
  const occupancy = prediction?.predicted_occupancy || 50;
  
  // Generate staffing recommendation
  const { data, error } = await supabase
    .from('venue_staffing_recommendations')
    .insert({
      venue_id: venueId,
      recommendation_date: new Date().toISOString().split('T')[0],
      target_date: saturdayStr,
      predicted_occupancy_percentage: occupancy,
      predicted_visitors: Math.floor(occupancy * 10),
      recommended_security: occupancy >= 80 ? 4 : occupancy >= 60 ? 3 : 2,
      recommended_bar_staff: occupancy >= 80 ? 6 : occupancy >= 60 ? 4 : 2,
      recommended_hosts: occupancy >= 80 ? 3 : occupancy >= 60 ? 2 : 1,
      ai_reasoning: occupancy >= 80 
        ? 'High capacity expected. Increase all staff by 20%.'
        : occupancy >= 60 
        ? 'Moderate capacity. Standard staffing sufficient.'
        : 'Low capacity expected. Consider reduced staffing.'
    })
    .select()
    .single();
  
  return data;
}

/**
 * Mark staffing recommendation as sent
 */
export async function markStaffingRecommendationSent(recommendationId: string) {
  const supabase = getSupabase();
  
  await supabase
    .from('venue_staffing_recommendations')
    .update({
      is_sent: true,
      sent_at: new Date().toISOString()
    })
    .eq('id', recommendationId);
  
  return { success: true };
}

// ============================================
// 4. PERSONALIZED RE-ENGAGEMENT ENGINE
// ============================================

/**
 * Get user's re-engagement campaigns
 */
export async function getUserReengagementCampaigns(userId: string): Promise<ReengagementCampaign[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('reengagement_campaigns')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'generated')
    .gte('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false });
  
  if (error) return [];
  
  // Get venue names
  const campaigns = data || [];
  for (const campaign of campaigns) {
    if (campaign.favorite_venue_id) {
      const { data: venue } = await supabase
        .from('venues')
        .select('name')
        .eq('id', campaign.favorite_venue_id)
        .single();
      (campaign as any).favorite_venue_name = venue?.name || 'your favorite venue';
    }
  }
  
  return campaigns;
}

/**
 * Generate re-engagement campaign for inactive user
 */
export async function generateReengagementCampaign(userId: string): Promise<{
  success: boolean;
  campaign?: ReengagementCampaign;
}> {
  const supabase = getSupabase();
  
  // Get user info
  const { data: user } = await supabase
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .single();
  
  // Get last check-in and favorite venue
  const { data: lastCheckin } = await supabase
    .from('checkins')
    .select('venue_id, timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  const favoriteVenueId = lastCheckin?.venue_id;
  
  // Calculate days inactive
  const daysInactive = lastCheckin 
    ? Math.floor((Date.now() - new Date(lastCheckin.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysInactive < 14) {
    return { success: false };
  }
  
  // Get favorite venue name
  let favoriteVenueName = 'your favorite venue';
  if (favoriteVenueId) {
    const { data: venueData } = await supabase
      .from('venues')
      .select('name')
      .eq('id', favoriteVenueId)
      .single();
    favoriteVenueName = venueData?.name || 'your favorite venue';
  }
  
  // Determine discount by tier
  const discountMap: Record<string, number> = {
    platinum: 25,
    gold: 20,
    silver: 15,
    bronze: 10
  };
  const discount = discountMap[user?.membership_tier || 'bronze'] || 10;
  
  // Generate campaign
  const { data: campaign, error } = await supabase
    .from('reengagement_campaigns')
    .insert({
      user_id: userId,
      user_tier: user?.membership_tier || 'bronze',
      campaign_type: daysInactive >= 30 ? 'win_back' : 'miss_you',
      days_inactive: daysInactive,
      last_venue_id: favoriteVenueId,
      favorite_venue_id: favoriteVenueId,
      discount_percentage: discount,
      valid_days: 7,
      personalized_message: `We miss you! It's been ${daysInactive} days since your last visit. Here's a special ${discount}% off for you!`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  
  if (error) return { success: false };
  
  return { success: true, campaign: { ...campaign, favorite_venue_name: favoriteVenueName } };
}

/**
 * Use re-engagement discount
 */
export async function useReengagementDiscount(campaignId: string): Promise<{ success: boolean; code?: string }> {
  const supabase = getSupabase();
  
  // Generate discount code
  const code = `REENG${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Update campaign
  await supabase
    .from('reengagement_campaigns')
    .update({
      status: 'used',
      used_at: new Date().toISOString()
    })
    .eq('id', campaignId);
  
  return { success: true, code };
}

/**
 * Get squad invite link
 */
export async function getSquadInviteLink(
  userId: string,
  venueId: string
): Promise<{ success: boolean; link?: string }> {
  const supabase = getSupabase();
  
  // Check for existing active link
  const { data: existing } = await supabase
    .from('squad_invite_links')
    .select('invite_token')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .single();
  
  if (existing) {
    return { 
      success: true, 
      link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nightlife.id'}/invite/${existing.invite_token}` 
    };
  }
  
  // Create new invite link
  const token = Math.random().toString(36).substring(2, 15);
  
  await supabase
    .from('squad_invite_links')
    .insert({
      user_id: userId,
      venue_id: venueId,
      invite_token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  
  return { 
    success: true, 
    link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nightlife.id'}/invite/${token}` 
  };
}

/**
 * Get fraud detection dashboard stats
 */
export async function getFraudStats() {
  const supabase = getSupabase();
  
  // Get flagged reviews count
  const { count: flaggedReviews } = await supabase
    .from('review_fraud_detection')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  // Get active anomalies
  const { count: activeAnomalies } = await supabase
    .from('transaction_anomalies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'detected');
  
  // Get total trust scores
  const { count: totalUsers } = await supabase
    .from('user_trust_scores')
    .select('*', { count: 'exact', head: true });
  
  // Get trusted users
  const { count: trustedUsers } = await supabase
    .from('user_trust_scores')
    .select('*', { count: 'exact', head: true })
    .gte('trust_score', 75);
  
  return {
    flagged_reviews: flaggedReviews || 0,
    active_anomalies: activeAnomalies || 0,
    total_users_scored: totalUsers || 0,
    trusted_users: trustedUsers || 0
  };
}
