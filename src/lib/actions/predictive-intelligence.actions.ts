'use server';

/**
 * PREDICTIVE INTELLIGENCE ACTIONS - PHASE 5.2
 * The Crystal Ball, Revenue Optimizer, Smart Discounts, Voice of the Guest
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for Phase 5.2

interface OccupancyPrediction {
  venue_id: string;
  venue_name: string;
  prediction_time: string;
  predicted_occupancy: number;
  predicted_occupancy_level: 'empty' | 'low' | 'medium' | 'high' | 'full';
  confidence_score: number;
  is_predicted_peak: boolean;
}

interface SmartBoostCampaign {
  id: string;
  venue_id: string;
  campaign_name: string;
  daily_budget: number;
  total_spent: number;
  auto_pilot_enabled: boolean;
  status: string;
  ai_recommendation: string;
  trigger_count: number;
  total_impressions: number;
  total_clicks: number;
  total_bookings: number;
}

interface SmartDiscountRule {
  id: string;
  venue_id: string;
  rule_name: string;
  discount_percentage: number;
  target_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'all';
  status: string;
  ai_generation_reason: string;
  current_uses: number;
  max_uses: number | null;
}

interface SentimentAnalysis {
  id: string;
  review_id: string;
  venue_id: string;
  overall_sentiment: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  aspect_sentiments: Record<string, number>;
  detected_themes: string[];
  action_items: string[];
}

interface SentimentSummary {
  id: string;
  venue_id: string;
  period_start: string;
  period_end: string;
  avg_sentiment: number;
  total_reviews: number;
  sentiment_trend: 'improving' | 'stable' | 'declining';
  top_issues: { issue: string; count: number; severity: string }[];
  top_positives: { positive: string; count: number }[];
  weekly_action_plan: { action: string; priority: string; assigned_to: string }[];
}

interface ConciergeRecommendation {
  venue_id: string;
  venue_name: string;
  category: string;
  price_range: number;
  address: string;
  rating: number;
  match_score: number;
  reason: string;
  booking_link: string;
}

interface CrossPromoOffer {
  id: string;
  offer_name: string;
  primary_venue_name: string;
  secondary_venue_name: string;
  discount_percentage: number;
  status: string;
  views: number;
  redemptions: number;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. PREDICTIVE CROWD FORECASTING (THE CRYSTAL BALL)
// ============================================

/**
 * Get predicted occupancy for a venue
 */
export async function getVenueOccupancyPrediction(
  venueId: string
): Promise<OccupancyPrediction | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('venue_occupancy_predictions')
    .select('*')
    .eq('venue_id', venueId)
    .gte('prediction_time', new Date().toISOString())
    .lte('prediction_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
    .order('predicted_occupancy', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) return null;
  
  return {
    venue_id: data.venue_id,
    venue_name: '',
    prediction_time: data.prediction_time,
    predicted_occupancy: data.predicted_occupancy,
    predicted_occupancy_level: data.predicted_occupancy_level,
    confidence_score: data.confidence_score,
    is_predicted_peak: data.is_predicted_peak
  };
}

/**
 * Get predicted peak time for venue
 */
export async function getPredictedPeakTime(venueId: string): Promise<{
  peak_time: string | null;
  occupancy: number;
  confidence: number;
} | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('venue_occupancy_predictions')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_predicted_peak', true)
    .gte('prediction_time', new Date().toISOString())
    .order('prediction_time', { ascending: true })
    .limit(1)
    .single();
  
  if (error || !data) {
    // Return default if no prediction
    return {
      peak_time: null,
      occupancy: 50,
      confidence: 0
    };
  }
  
  return {
    peak_time: data.prediction_time,
    occupancy: data.predicted_occupancy,
    confidence: data.confidence_score
  };
}

/**
 * Generate occupancy predictions for a venue
 * (This would typically be called by a scheduled edge function)
 */
export async function generateOccupancyPredictions(venueId: string) {
  const supabase = getSupabase();
  
  // Get historical check-in data
  const { data: checkins } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('venue_id', venueId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get social buzz
  const { data: buzz } = await supabase
    .from('social_buzz_tracking')
    .select('*')
    .eq('venue_id', venueId)
    .gte('tracked_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get external factors (weather, events)
  const { data: factors } = await supabase
    .from('external_factors')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
  
  // Generate predictions for next 48 hours (every 2 hours)
  const predictions = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const predictionTime = new Date(now.getTime() + i * 2 * 60 * 60 * 1000);
    const hour = predictionTime.getHours();
    
    // Simple prediction model (would use ML in production)
    let baseOccupancy = 30;
    
    // Peak hours (21:00 - 01:00)
    if (hour >= 21 || hour <= 1) {
      baseOccupancy += 40;
    }
    // Evening (18:00 - 21:00)
    else if (hour >= 18 && hour < 21) {
      baseOccupancy += 20;
    }
    // Early morning
    else if (hour >= 2 && hour < 6) {
      baseOccupancy = Math.max(5, baseOccupancy - 20);
    }
    
    // Day of week effect
    const dayOfWeek = predictionTime.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday, Saturday
      baseOccupancy += 15;
    }
    
    // External factors adjustment
    const hasRain = factors?.some(f => 
      f.factor_type === 'weather' && 
      f.factor_value === 'rain' &&
      new Date(f.start_time) <= predictionTime &&
      new Date(f.end_time || f.start_time) >= predictionTime
    );
    if (hasRain) {
      baseOccupancy += 20; // Rain drives people indoors
    }
    
    // Social buzz boost
    const buzzScore = buzz?.length || 0;
    baseOccupancy += buzzScore * 2;
    
    const predictedOccupancy = Math.min(100, Math.max(5, baseOccupancy));
    const occupancyLevel = predictedOccupancy >= 90 ? 'full' :
                           predictedOccupancy >= 70 ? 'high' :
                           predictedOccupancy >= 40 ? 'medium' :
                           predictedOccupancy >= 20 ? 'low' : 'empty';
    
    predictions.push({
      venue_id: venueId,
      prediction_time: predictionTime.toISOString(),
      predicted_occupancy: predictedOccupancy,
      predicted_occupancy_level: occupancyLevel,
      confidence_score: 0.75 + Math.random() * 0.2,
      is_predicted_peak: predictedOccupancy >= 80,
      input_features: JSON.stringify({
        hour,
        dayOfWeek,
        hasRain,
        buzzScore
      })
    });
  }
  
  // Insert predictions
  const { data, error } = await supabase
    .from('venue_occupancy_predictions')
    .upsert(predictions, { onConflict: 'venue_id,prediction_time' })
    .select();
  
  return { success: !error, predicted: predictions.length };
}

// ============================================
// 2. SMART-BOOST 2.0 (AUTONOMOUS BIDDING)
// ============================================

/**
 * Get smart boost campaigns for a venue
 */
export async function getSmartBoostCampaigns(venueId: string): Promise<SmartBoostCampaign[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('smart_boost_campaigns')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Create smart boost campaign with auto-pilot
 */
export async function createSmartBoostCampaign(
  venueId: string,
  ownerId: string,
  campaignData: {
    name: string;
    daily_budget: number;
    auto_pilot_enabled?: boolean;
  }
): Promise<{ success: boolean; data?: SmartBoostCampaign; error?: string }> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('smart_boost_campaigns')
    .insert({
      venue_id: venueId,
      owner_id: ownerId,
      campaign_name: campaignData.name,
      daily_budget: campaignData.daily_budget,
      auto_pilot_enabled: campaignData.auto_pilot_enabled ?? true,
      status: 'active',
      ai_recommendation: 'Auto-pilot enabled. AI will trigger boosts when occupancy is low or audience is detected nearby.',
      started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { success: !error, data, error: error?.message };
}

/**
 * Check if smart boost should trigger
 */
export async function checkSmartBoostTrigger(
  venueId: string
): Promise<{
  should_trigger: boolean;
  reason: string;
  current_occupancy: number;
  audience_count: number;
}> {
  const supabase = getSupabase();
  
  // Get current predicted occupancy
  const { data: prediction } = await supabase
    .from('venue_occupancy_predictions')
    .select('predicted_occupancy')
    .eq('venue_id', venueId)
    .gte('prediction_time', new Date().toISOString())
    .order('prediction_time', { ascending: true })
    .limit(1)
    .single();
  
  const currentOccupancy = prediction?.predicted_occupancy || 50;
  
  // Check trigger conditions (simplified)
  const shouldTrigger = currentOccupancy < 50;
  const reason = shouldTrigger 
    ? `Low occupancy detected (${currentOccupancy}%)` 
    : 'Occupancy levels are healthy';
  
  return {
    should_trigger: shouldTrigger,
    reason,
    current_occupancy: currentOccupancy,
    audience_count: 0 // Would query active users nearby
  };
}

/**
 * Trigger smart boost manually
 */
export async function triggerSmartBoost(
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  
  // Get campaign details
  const { data: campaign } = await supabase
    .from('smart_boost_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }
  
  // Log trigger
  const { data: triggerLog, error: logError } = await supabase
    .from('boost_trigger_logs')
    .insert({
      campaign_id: campaignId,
      venue_id: campaign.venue_id,
      trigger_reason: 'manual_trigger',
      trigger_details: JSON.stringify({
        daily_budget: campaign.daily_budget,
        auto_pilot: campaign.auto_pilot_enabled
      }),
      predicted_occupancy: 30 // Would get actual
    })
    .select()
    .single();
  
  // Update campaign
  await supabase
    .from('smart_boost_campaigns')
    .update({
      trigger_count: campaign.trigger_count + 1,
      last_triggered_at: new Date().toISOString(),
      total_spent: campaign.total_spent + Math.ceil(campaign.daily_budget / 24)
    })
    .eq('id', campaignId);
  
  return { success: !logError, error: logError?.message };
}

/**
 * Toggle auto-pilot for smart boost
 */
export async function toggleSmartBoostAutoPilot(
  campaignId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('smart_boost_campaigns')
    .update({
      auto_pilot_enabled: enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);
  
  return { success: true };
}

// ============================================
// 3. AI-DRIVEN DYNAMIC PRICING (SMART DISCOUNTS)
// ============================================

/**
 * Get smart discount rules for a venue
 */
export async function getSmartDiscountRules(venueId: string): Promise<SmartDiscountRule[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('smart_discount_rules')
    .select('*')
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Create smart discount rule
 */
export async function createSmartDiscountRule(
  venueId: string,
  ruleData: {
    name: string;
    discount_percentage: number;
    target_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'all';
    max_uses?: number;
    ai_generated?: boolean;
  }
): Promise<{ success: boolean; data?: SmartDiscountRule; error?: string }> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('smart_discount_rules')
    .insert({
      venue_id: venueId,
      rule_name: ruleData.name,
      discount_percentage: ruleData.discount_percentage,
      target_tier: ruleData.target_tier,
      max_uses: ruleData.max_uses,
      ai_generation_reason: ruleData.ai_generated 
        ? 'AI detected slow period - generating discount to fill tables'
        : 'Manually created',
      status: 'active'
    })
    .select()
    .single();
  
  return { success: !error, data, error: error?.message };
}

/**
 * AI-generate smart discount for slow periods
 */
export async function generateAISmartDiscount(
  venueId: string
): Promise<{ success: boolean; discount?: SmartDiscountRule }> {
  const supabase = getSupabase();
  
  // Check current occupancy
  const { data: prediction } = await supabase
    .from('venue_occupancy_predictions')
    .select('predicted_occupancy')
    .eq('venue_id', venueId)
    .gte('prediction_time', new Date().toISOString())
    .order('prediction_time', { ascending: true })
    .limit(1)
    .single();
  
  const currentOccupancy = prediction?.predicted_occupancy || 50;
  
  // Only generate discount if low occupancy
  if (currentOccupancy >= 50) {
    return { success: false };
  }
  
  // Determine discount based on occupancy
  const discountPercentage = currentOccupancy < 20 ? 40 :
                             currentOccupancy < 30 ? 30 :
                             currentOccupancy < 40 ? 25 : 20;
  
  // Determine target tier (higher tier = bigger discount)
  const targetTier = currentOccupancy < 25 ? 'platinum' : 'gold';
  
  const { data: discount, error } = await supabase
    .from('smart_discount_rules')
    .insert({
      venue_id: venueId,
      rule_name: `AI Smart Discount - ${new Date().toLocaleDateString('id-ID')}`,
      discount_percentage: discountPercentage,
      target_tier: targetTier,
      ai_generation_reason: `AI detected low occupancy (${currentOccupancy}%) - generating ${discountPercentage}% discount for ${targetTier} members`,
      status: 'active',
      valid_days: [1, 2, 3, 4, 5], // Monday-Friday
      valid_start_time: '18:00:00',
      valid_end_time: '23:00:00'
    })
    .select()
    .single();
  
  return { success: !error, discount };
}

/**
 * Claim smart discount
 */
export async function claimSmartDiscount(
  ruleId: string,
  userId: string,
  venueId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = getSupabase();
  
  // Generate discount code
  const code = `NIGHT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Check if rule has uses left
  const { data: rule } = await supabase
    .from('smart_discount_rules')
    .select('*')
    .eq('id', ruleId)
    .single();
  
  if (!rule) {
    return { success: false, error: 'Rule not found' };
  }
  
  if (rule.max_uses && rule.current_uses >= rule.max_uses) {
    return { success: false, error: 'Discount exhausted' };
  }
  
  // Create claim
  const { error } = await supabase
    .from('smart_discount_claims')
    .insert({
      rule_id: ruleId,
      user_id: userId,
      venue_id: venueId,
      discount_code: code,
      discount_value: rule.discount_percentage,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Update rule count
  await supabase
    .from('smart_discount_rules')
    .update({ current_uses: (rule.current_uses || 0) + 1 })
    .eq('id', ruleId);
  
  return { success: true, code };
}

// ============================================
// 4. DEEP-LEARNING SENTIMENT ANALYTICS (VOICE OF THE GUEST)
// ============================================

/**
 * Analyze sentiment for a review
 */
export async function analyzeReviewSentiment(
  reviewId: string,
  reviewType: 'vibe_check' | 'google' | 'tripadvisor',
  venueId: string,
  reviewText: string
): Promise<{ success: boolean; analysis?: SentimentAnalysis }> {
  const supabase = getSupabase();
  
  // Simple sentiment analysis (would use ML in production)
  const positiveWords = ['great', 'amazing', 'awesome', 'love', 'best', 'excellent', 'fantastic', 'good', 'nice'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'poor', 'disappointing', 'noisy', 'dirty', 'slow'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  const lowerText = reviewText.toLowerCase();
  
  positiveWords.forEach(w => { if (lowerText.includes(w)) positiveCount++; });
  negativeWords.forEach(w => { if (lowerText.includes(w)) negativeCount++; });
  
  const total = positiveCount + negativeCount || 1;
  const sentiment = (positiveCount - negativeCount) / total;
  
  const overallSentiment = Math.max(-1, Math.min(1, sentiment));
  const sentimentLabel = overallSentiment > 0.2 ? 'positive' :
                         overallSentiment < -0.2 ? 'negative' : 'neutral';
  
  // Detect themes
  const themes: string[] = [];
  if (lowerText.includes('music') || lowerText.includes('dj')) themes.push('music');
  if (lowerText.includes('service') || lowerText.includes('staff')) themes.push('service');
  if (lowerText.includes('food') || lowerText.includes('drink')) themes.push('food');
  if (lowerText.includes('ambiance') || lowerText.includes('vibe')) themes.push('ambiance');
  if (lowerText.includes('ac') || lowerText.includes('air') || lowerText.includes('temperature')) themes.push('ac');
  if (lowerText.includes('queue') || lowerText.includes('wait')) themes.push('wait_time');
  if (lowerText.includes('price') || lowerText.includes('expensive') || lowerText.includes('cheap')) themes.push('pricing');
  
  // Generate action items
  const actionItems: string[] = [];
  if (negativeCount > 0) {
    if (themes.includes('ac')) actionItems.push('Check and fix AC temperature');
    if (themes.includes('wait_time')) actionItems.push('Improve queue management');
    if (themes.includes('service')) actionItems.push('Staff training needed');
  }
  
  const { data, error } = await supabase
    .from('review_sentiment_analysis')
    .insert({
      review_id: reviewId,
      review_type: reviewType,
      venue_id: venueId,
      overall_sentiment: overallSentiment,
      sentiment_label: sentimentLabel,
      aspect_sentiments: {
        overall: overallSentiment,
        // Simplified aspect scores
        music: sentiment * 0.8 + 0.2,
        service: sentiment * 0.9 + 0.1,
        ambiance: sentiment * 0.7 + 0.3
      },
      detected_themes: themes,
      action_items: actionItems,
      ai_model_version: 'nightlife-sentiment-v1'
    })
    .select()
    .single();
  
  return { success: !error, analysis: data };
}

/**
 * Get sentiment summary for a venue
 */
export async function getVenueSentimentSummary(
  venueId: string,
  days: number = 7
): Promise<SentimentSummary | null> {
  const supabase = getSupabase();
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  
  const { data, error } = await supabase
    .from('venue_sentiment_summaries')
    .select('*')
    .eq('venue_id', venueId)
    .gte('period_start', startDate.toISOString().split('T')[0])
    .lte('period_end', endDate.toISOString().split('T')[0])
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    // Generate on-the-fly
    return await generateSentimentSummary(venueId, days);
  }
  
  return data;
}

/**
 * Generate sentiment summary
 */
export async function generateSentimentSummary(
  venueId: string,
  days: number = 7
): Promise<SentimentSummary | null> {
  const supabase = getSupabase();
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Get all sentiments for the period
  const { data: sentiments } = await supabase
    .from('review_sentiment_analysis')
    .select('*')
    .eq('venue_id', venueId)
    .gte('analyzed_at', startDate.toISOString());
  
  if (!sentiments || sentiments.length === 0) {
    return null;
  }
  
  // Calculate averages
  const avgSentiment = sentiments.reduce((acc, s) => acc + s.overall_sentiment, 0) / sentiments.length;
  
  // Count themes
  const themeCounts: Record<string, number> = {};
  sentiments.forEach(s => {
    (s.detected_themes || []).forEach((t: string) => {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    });
  });
  
  // Get top issues (negative sentiments)
  const issues = sentiments
    .filter(s => s.overall_sentiment < -0.2)
    .flatMap(s => s.action_items || [])
    .slice(0, 5);
  
  const issueCounts = issues.reduce((acc, i) => {
    acc[i] = (acc[i] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topIssues = (Object.entries(issueCounts) as [string, number][])
    .map(([issue, count]) => ({ issue, count, severity: count > 2 ? 'high' : 'medium' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Get top positives
  const positives = sentiments
    .filter(s => s.overall_sentiment > 0.2)
    .flatMap(s => s.detected_themes || [])
    .filter((t: string) => !['ac', 'wait_time', 'pricing'].includes(t));
  
  const positiveCounts = positives.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topPositives = (Object.entries(positiveCounts) as [string, number][])
    .map(([positive, count]) => ({ positive, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Determine trend
  const recentSentiments = sentiments.slice(0, Math.ceil(sentiments.length / 2));
  const oldSentiments = sentiments.slice(Math.ceil(sentiments.length / 2));
  const recentAvg = recentSentiments.reduce((a, s) => a + s.overall_sentiment, 0) / (recentSentiments.length || 1);
  const oldAvg = oldSentiments.reduce((a, s) => a + s.overall_sentiment, 0) / (oldSentiments.length || 1);
  
  const trend = recentAvg > oldAvg + 0.1 ? 'improving' :
                recentAvg < oldAvg - 0.1 ? 'declining' : 'stable';
  
  // Generate weekly action plan
  const weeklyActionPlan = topIssues.map(issue => ({
    action: issue.issue,
    priority: issue.severity,
    assigned_to: issue.issue.includes('AC') ? 'maintenance' :
                 issue.issue.includes('service') ? 'management' : 'ops'
  }));
  
  // Insert summary
  const { data, error } = await supabase
    .from('venue_sentiment_summaries')
    .insert({
      venue_id: venueId,
      period_start: startDate.toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      avg_sentiment: avgSentiment,
      total_reviews: sentiments.length,
      sentiment_trend: trend,
      top_issues: topIssues,
      top_positives: topPositives,
      weekly_action_plan: weeklyActionPlan
    })
    .select()
    .single();
  
  return data;
}

// ============================================
// 5. AI CONCIERGE (VIBE CONCIERGE)
// ============================================

/**
 * Get concierge recommendations
 */
export async function getConciergeRecommendations(
  userId: string | null,
  query: string,
  budget?: number,
  location?: string,
  musicPreference?: string
): Promise<{
  recommendations: ConciergeRecommendation[];
  reasoning: string;
  sessionId: string;
}> {
  const supabase = getSupabase();
  
  // Parse query for preferences
  const lowerQuery = query.toLowerCase();
  const hasDate = lowerQuery.includes('date');
  const hasGroup = lowerQuery.includes('group') || lowerQuery.includes('friends') || lowerQuery.length > 20;
  const hasRnB = lowerQuery.includes('rnb') || lowerQuery.includes('r&b');
  const hasCocktails = lowerQuery.includes('cocktail') || lowerQuery.includes('drinks');
  const hasBudget = budget || (lowerQuery.includes('jt') ? parseInt(lowerQuery.match(/(\d+)\s*jt/)?.[1] || '2') : 2);
  const hasLocation = location || (lowerQuery.includes('senopati') ? 'Jakarta' :
                         lowerQuery.includes('bali') ? 'Bali' :
                         lowerQuery.includes('bandung') ? 'Bandung' : null);
  
  // Build search criteria
  const musicGenres = hasRnB ? ['rnb', 'hiphop', 'soul'] : [];
  
  // Get venues matching criteria
  let queryBuilder = supabase
    .from('venues')
    .select('id, name, category, address, city, price_range, rating, images, music_genre')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(10);
  
  if (hasLocation) {
    queryBuilder = queryBuilder.ilike('city', `%${hasLocation}%`);
  }
  
  const { data: venues } = await queryBuilder;
  
  if (!venues || venues.length === 0) {
    return {
      recommendations: [],
      reasoning: 'No venues found matching your criteria',
      sessionId: ''
    };
  }
  
  // Score and rank venues
  const scoredVenues = venues.map(venue => {
    let score = venue.rating * 20;
    
    // Music preference match
    if (musicPreference && musicGenres.length > 0) {
      const genreMatch = musicGenres.some(g => 
        (venue.music_genre || '').toLowerCase().includes(g)
      );
      if (genreMatch) score += 20;
    }
    
    // Budget match
    if (hasBudget && venue.price_range) {
      const budgetDiff = Math.abs(venue.price_range - hasBudget);
      score += (3 - budgetDiff) * 10;
    }
    
    // Category preference
    if (hasDate && venue.category === 'club') score += 10;
    if (hasCocktails) score += 5;
    
    return { venue, score };
  });
  
  // Get top 3
  const topVenues = scoredVenues
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  // Generate recommendations
  const recommendations: ConciergeRecommendation[] = topVenues.map((sv, index) => ({
    venue_id: sv.venue.id,
    venue_name: sv.venue.name,
    category: sv.venue.category,
    price_range: sv.venue.price_range,
    address: sv.venue.address,
    rating: sv.venue.rating,
    match_score: sv.score,
    reason: sv.score > 80 ? `Perfect match for ${hasDate ? 'your date' : 'your preferences'}` :
            `Great choice${hasRnB ? ' for RnB lovers' : ''}`,
    booking_link: `/checkin/${sv.venue.id}`
  }));
  
  // Generate reasoning
  let reasoning = '';
  if (hasDate) reasoning = 'I found 3 romantic spots perfect for a date night';
  else if (hasGroup) reasoning = 'These venues are great for group hangouts';
  else reasoning = 'Based on your preferences, here are my top picks';
  
  if (hasRnB) reasoning += ' with excellent RnB music';
  if (hasLocation) reasoning += ` in ${hasLocation}`;
  
  // Create session log
  const { data: session } = await supabase
    .from('concierge_sessions')
    .insert({
      user_id: userId,
      user_query: query,
      user_budget: hasBudget,
      user_location: hasLocation || undefined,
      user_preferences: JSON.stringify({
        music: musicPreference || (hasRnB ? 'rnb' : null),
        occasion: hasDate ? 'date' : hasGroup ? 'group' : 'solo'
      }),
      ai_response: JSON.stringify({
        recommendations,
        reasoning
      })
    })
    .select()
    .single();
  
  return {
    recommendations,
    reasoning,
    sessionId: session?.id || ''
  };
}

/**
 * Rate concierge recommendation
 */
export async function rateConciergeSession(
  sessionId: string,
  rating: number
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('concierge_sessions')
    .update({
      user_rating: rating,
      session_completed: true,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId);
  
  return { success: true };
}

// ============================================
// 6. CROSS-PROMOTION SYNDICATE
// ============================================

/**
 * Get cross-promo offers for a venue
 */
export async function getCrossPromoOffers(venueId: string): Promise<CrossPromoOffer[]> {
  const supabase = getSupabase();
  
  // Get offers where venue is primary or secondary
  const { data, error } = await supabase
    .from('cross_promo_offers')
    .select(`
      *,
      primary_venue:venues!primary_venue_id(name),
      secondary_venue:venues!secondary_venue_id(name)
    `)
    .eq('status', 'active')
    .or(`primary_venue_id.eq.${venueId},secondary_venue_id.eq.${venueId}`)
    .order('created_at', { ascending: false });
  
  if (error || !data) return [];
  
  return (data || []).map((offer: any) => ({
    id: offer.id,
    offer_name: offer.offer_name,
    primary_venue_name: offer.primary_venue?.name || '',
    secondary_venue_name: offer.secondary_venue?.name || '',
    discount_percentage: offer.discount_percentage,
    status: offer.status,
    views: offer.views,
    redemptions: offer.redemptions
  }));
}

/**
 * AI-generate cross-promo recommendations
 */
export async function generateCrossPromoRecommendations(
  venueId: string
): Promise<{ success: boolean; recommendations?: any[] }> {
  const supabase = getSupabase();
  
  // Get venue category
  const { data: venue } = await supabase
    .from('venues')
    .select('category, city')
    .eq('id', venueId)
    .single();
  
  if (!venue) return { success: false };
  
  // Find venues in same city with different category
  const { data: similarVenues } = await supabase
    .from('venues')
    .select('id, name, category, city')
    .eq('is_active', true)
    .eq('city', venue.city)
    .neq('id', venueId)
    .limit(20);
  
  // For demo, just return some recommendations
  const recommendations = [
    {
      venue_id: venueId,
      suggested_partner_id: similarVenues?.[0]?.id,
      reason: 'Complementary experience - customers who visit your venue often enjoy',
      potential_audience_overlap: 0.6
    }
  ];
  
  return { success: true, recommendations };
}
