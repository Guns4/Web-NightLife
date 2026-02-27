'use server';

/**
 * AI AUTOMATION ACTIONS - PHASE 5
 * The Neural Brain: Recommendation Engine, Smart Push, Content Curation
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface VenueMatch {
  venue_id: string;
  venue_name: string;
  venue_image: string;
  match_score: number;
  match_reason: string;
  music_match: number;
  social_match: number;
  proximity_match: number;
}

interface SmartPushCampaign {
  id: string;
  title: string;
  message: string;
  campaign_type: string;
  status: string;
  sent_count: number;
  open_count: number;
}

interface ContentHighlight {
  id: string;
  story_id: string;
  media_url: string;
  user_name: string;
  venue_name: string;
  ai_caption: string;
  view_count: number;
  curation_score: number;
}

interface NightlifeReport {
  id: string;
  report_month: string;
  total_visits: number;
  unique_venues: number;
  total_spent: number;
  top_genre: string;
  top_venue: string;
  vibe_persona: string;
  cities_visited: string[];
  local_rank: number;
  percentile: number;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. VIBE-MATCH RECOMMENDATION ENGINE
// ============================================

/**
 * Get personalized venue recommendations for user
 */
export async function getVibeMatchRecommendations(
  userId: string,
  limit: number = 10
): Promise<VenueMatch[]> {
  const supabase = getSupabase();
  
  // Get user's AI profile
  const { data: aiProfile } = await supabase
    .from('ai_user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Get all active venues
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, cover_image, music_genre, address, latitude, longitude')
    .eq('is_active', true)
    .limit(50);
  
  if (!venues) return [];
  
  // Get user's friends for social scoring
  const { data: friends } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'accepted');
  
  const friendIds = friends?.map(f => f.friend_id) || [];
  
  // Calculate match for each venue
  const matches: VenueMatch[] = [];
  
  for (const venue of venues) {
    // Get friends checked in here
    const { data: friendsHere } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('venue_id', venue.id)
      .eq('status', 'active')
      .in('user_id', friendIds);
    
    const friendsCount = friendsHere?.length || 0;
    
    // Calculate scores (simplified)
    const musicMatch = aiProfile?.music_preference_scores?.[venue.music_genre] 
      ? Math.round(aiProfile.music_preference_scores[venue.music_genre] * 100)
      : 50 + Math.floor(Math.random() * 30);
    
    const socialMatch = Math.min(100, friendsCount * 30 + 20);
    const proximityMatch = 70 + Math.floor(Math.random() * 30); // Simplified
    const overallScore = Math.round(musicMatch * 0.35 + socialMatch * 0.35 + proximityMatch * 0.3);
    
    // Generate reason
    let reason = `${overallScore}% Match`;
    if (friendsCount > 0) {
      reason = `${overallScore}% Match: ${friendsCount} friend${friendsCount > 1 ? 's' : ''} here`;
    }
    if (venue.music_genre) {
      reason += ` & they play ${venue.music_genre}`;
    }
    
    matches.push({
      venue_id: venue.id,
      venue_name: venue.name,
      venue_image: venue.cover_image || '',
      match_score: overallScore,
      match_reason: reason,
      music_match: musicMatch,
      social_match: socialMatch,
      proximity_match: proximityMatch
    });
  }
  
  // Sort by score and return top results
  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

/**
 * Update user AI profile based on activity
 */
export async function updateUserAIProfile(
  userId: string,
  updates: {
    music_genre?: string;
    spend_amount?: number;
    tier?: string;
  }
) {
  const supabase = getSupabase();
  
  // Get current profile
  const { data: current } = await supabase
    .from('ai_user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  const currentScores = current?.music_preference_scores || {};
  const currentSpending = current?.spending_pattern || {};
  
  // Update music preference
  if (updates.music_genre) {
    const currentScore = currentScores[updates.music_genre] || 0;
    currentScores[updates.music_genre] = Math.min(1, currentScore + 0.1);
  }
  
  // Update spending pattern
  if (updates.spend_amount) {
    currentSpending.avg_spend = ((currentSpending.avg_spend || 0) + updates.spend_amount) / 2;
  }
  
  // Upsert profile
  const { data, error } = await supabase
    .from('ai_user_profiles')
    .upsert({
      user_id: userId,
      music_preference_scores: currentScores,
      spending_pattern: currentSpending,
      last_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { success: !error, data, error };
}

/**
 * Log user activity for AI analysis
 */
export async function logUserActivity(
  userId: string,
  activityType: 'venue_view' | 'venue_search' | 'booking_start' | 'booking_abandon' | 'checkin',
  venueId?: string,
  metadata?: Record<string, any>
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('user_activity_logs')
    .insert({
      user_id: userId,
      activity_type: activityType,
      venue_id: venueId,
      metadata: metadata || {},
      session_id: Math.random().toString(36).substring(7)
    });
  
  return { success: !error, error };
}

// ============================================
// 2. SMART-PUSH NOTIFICATIONS
// ============================================

/**
 * Get personalized push notifications for user
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  const supabase = getSupabase();
  
  return await supabase
    .from('push_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Send smart push campaign
 */
export async function sendSmartPush(
  campaignId: string,
  userId: string
) {
  const supabase = getSupabase();
  
  // Get campaign details
  const { data: campaign } = await supabase
    .from('smart_push_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  if (!campaign) {
    return { success: false, message: 'Campaign not found' };
  }
  
  // Create notification
  const { data, error } = await supabase
    .from('push_notifications')
    .insert({
      user_id: userId,
      campaign_id: campaignId,
      title: campaign.title,
      body: campaign.message,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  // Update campaign stats
  await supabase
    .from('smart_push_campaigns')
    .update({ sent_count: campaign.sent_count + 1 })
    .eq('id', campaignId);
  
  return { success: true, data };
}

/**
 * Create abandoned plan notification
 */
export async function createAbandonedPlanNotification(
  userId: string,
  venueId: string,
  venueName: string
) {
  const supabase = getSupabase();
  
  const messages = [
    `Masih ragu? Ada promo Buy 1 Get 1 khusus malam ini di ${venueName}!`,
    `Jangan lewatkan malam ini di ${venueName} - temanmu sudah ada di sana!`,
    `Hey! Ada table kosong di ${venueName}, kapan mau booking?`
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  const { data, error } = await supabase
    .from('push_notifications')
    .insert({
      user_id: userId,
      title: '🎉 Ada yang值得我们注意!',
      body: message,
      data: { venue_id: venueId, type: 'abandoned_plan' },
      status: 'pending'
    });
  
  return { success: !error, error };
}

/**
 * Get abandoned plans and send notifications
 */
export async function processAbandonedPlans() {
  const supabase = getSupabase();
  
  // Get venues with 3+ views but no booking
  const { data: views } = await supabase
    .from('user_activity_logs')
    .select('user_id, venue_id, venue:venues(name)')
    .eq('activity_type', 'venue_view')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Group by user-venue
  const userVenueViews: Record<string, { venueId: string; venueName: string; count: number }> = {};
  
  (views || []).forEach((v: any) => {
    const key = `${v.user_id}_${v.venue_id}`;
    if (!userVenueViews[key]) {
      userVenueViews[key] = {
        venueId: v.venue_id,
        venueName: v.venues?.name || 'venue ini',
        count: 0
      };
    }
    userVenueViews[key].count++;
  });
  
  // Process abandoned plans (3+ views, no booking)
  const results = [];
  for (const [key, data] of Object.entries(userVenueViews)) {
    if (data.count >= 3) {
      const [userId] = key.split('_');
      const result = await createAbandonedPlanNotification(userId, data.venueId, data.venueName);
      results.push({ userId, ...result });
    }
  }
  
  return { processed: results.length, results };
}

// ============================================
// 3. AI CONTENT CURATION
// ============================================

/**
 * Get curated highlights for home feed
 */
export async function getCuratedHighlights(limit: number = 5): Promise<ContentHighlight[]> {
  const supabase = getSupabase();
  
  const { data: highlights, error } = await supabase
    .from('content_highlights')
    .select(`
      id,
      story_id,
      ai_caption,
      curation_score,
      view_count,
      story:nightlife_stories(
        media_url,
        user:user_profiles(full_name),
        venue:venues(name)
      )
    `)
    .eq('is_active', true)
    .order('curation_score', { ascending: false })
    .limit(limit);
  
  if (error || !highlights) return [];
  
  return (highlights as any[]).map(h => ({
    id: h.id,
    story_id: h.story_id,
    media_url: h.story?.media_url,
    user_name: h.story?.user?.full_name || 'Anonymous',
    venue_name: h.story?.venue?.name || '',
    ai_caption: h.ai_caption || '🔥 Hot tonight!',
    view_count: h.view_count,
    curation_score: h.curation_score
  }));
}

/**
 * Generate AI caption for story
 */
export async function generateAICaption(storyId: string): Promise<string> {
  const supabase = getSupabase();
  
  // Get story details
  const { data: story } = await supabase
    .from('nightlife_stories')
    .select(`
      id,
      venue:venues(name, music_genre),
      user:user_profiles(full_name),
      view_count
    `)
    .eq('id', storyId)
    .single();
  
  if (!story) return '🔥 Epic night!';
  
  // Generate caption based on data (mock - in production use LLM)
  const captions = [
    `🎉 ${(story as any).user?.full_name} is living the best life at ${(story as any).venue?.name}!`,
    `✨ Tonight's vibe at ${(story as any).venue?.name} is unreal!`,
    `💫 ${(story as any).venue?.name} x NightLife = Perfection`,
    `🌙 Another legendary night at ${(story as any).venue?.name}!`,
    `🔥 This is what Friday nights feel like!`
  ];
  
  const caption = captions[Math.floor(Math.random() * captions.length)];
  
  // Update story with AI caption
  await supabase
    .from('content_highlights')
    .upsert({
      story_id: storyId,
      ai_caption: caption,
      ai_caption_model: 'nightlife-v1',
      generated_at: new Date().toISOString()
    });
  
  return caption;
}

/**
 * Auto-curate top stories
 */
export async function autoCurateStories() {
  const supabase = getSupabase();
  
  // Get recent active stories
  const { data: stories } = await supabase
    .from('nightlife_stories')
    .select('id, view_count, created_at')
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .order('view_count', { ascending: false })
    .limit(20);
  
  // Calculate curation scores and insert highlights
  for (let i = 0; i < (stories?.length || 0); i++) {
    const story = stories![i];
    const hoursSincePosting = (Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60);
    const engagementScore = (story.view_count || 1) / Math.max(1, hoursSincePosting);
    
    await supabase
      .from('content_highlights')
      .upsert({
        story_id: story.id,
        view_count: story.view_count,
        curation_score: engagementScore,
        display_order: i,
        is_featured: i < 5,
        is_active: true
      });
  }
  
  return { curated: stories?.length || 0 };
}

// ============================================
// 4. AI AD OPTIMIZER
// ============================================

/**
 * Get AI ad campaign suggestions
 */
export async function getAISuggestions(venueId: string, budget: number) {
  const supabase = getSupabase();
  
  // Analyze historical data
  const { data: pastAds } = await supabase
    .from('ai_ad_campaigns')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Analyze user activity patterns
  const { data: activity } = await supabase
    .from('user_activity_logs')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Find peak hours (mock)
  const peakHours = ['21:00', '22:00', '23:00', '00:00'];
  const bestDays = ['Friday', 'Saturday'];
  
  // Calculate suggested budget distribution
  const dailyBudget = Math.ceil(budget / 7);
  const schedule = peakHours.map(hour => ({
    time: hour,
    budget: Math.ceil(dailyBudget * 0.4),
    days: bestDays
  }));
  
  // Get target audience size (users with high match score)
  const { count: targetSize } = await supabase
    .from('venue_ai_scores')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .gte('overall_score', 70);
  
  return {
    suggested_schedule: schedule,
    target_audience_size: targetSize || 1000,
    predicted_reach: Math.round((targetSize || 1000) * 1.5),
    predicted_conversions: Math.round((targetSize || 1000) * 0.05),
    confidence: 0.85
  };
}

/**
 * Create AI-optimized ad campaign
 */
export async function createAIAdCampaign(
  venueId: string,
  ownerId: string,
  campaignData: {
    name: string;
    budget: number;
    duration_days: number;
  }
) {
  const supabase = getSupabase();
  
  // Get AI suggestions
  const suggestions = await getAISuggestions(venueId, campaignData.budget);
  
  // Create campaign
  const { data, error } = await supabase
    .from('ai_ad_campaigns')
    .insert({
      venue_id: venueId,
      owner_id: ownerId,
      campaign_name: campaignData.name,
      budget: campaignData.budget,
      duration_days: campaignData.duration_days,
      ai_optimized: true,
      suggested_budget: campaignData.budget,
      suggested_schedule: JSON.stringify(suggestions.suggested_schedule),
      target_audience_size: suggestions.target_audience_size,
      predicted_reach: suggestions.predicted_reach,
      predicted_conversions: suggestions.predicted_conversions,
      status: 'draft'
    })
    .select()
    .single();
  
  return { success: !error, data, error };
}

// ============================================
// 5. NIGHTLIFE REPORT
// ============================================

/**
 * Get user's monthly report
 */
export async function getNightlifeReport(
  userId: string,
  month?: number,
  year?: number
): Promise<NightlifeReport | null> {
  const supabase = getSupabase();
  
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();
  
  const { data: report, error } = await supabase
    .from('nightlife_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_month', `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`)
    .single();
  
  if (error || !report) return null;
  
  return {
    id: report.id,
    report_month: report.report_month,
    total_visits: report.total_visits,
    unique_venues: report.unique_venues,
    total_spent: report.total_spent,
    top_genre: report.top_genre || 'Various',
    top_venue: report.top_venue || 'N/A',
    vibe_persona: report.vibe_persona || 'Party Animal',
    cities_visited: report.cities_visited || [],
    local_rank: report.local_rank || 0,
    percentile: report.percentile || 50
  };
}

/**
 * Generate monthly report for user
 */
export async function generateMonthlyReport(userId: string) {
  const supabase = getSupabase();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  // Get check-in stats
  const { data: checkins } = await supabase
    .from('checkins')
    .select('venue_id, venues(name)')
    .eq('user_id', userId)
    .gte('timestamp', `${year}-${String(month).padStart(2, '0')}-01`);
  
  const totalVisits = checkins?.length || 0;
  const uniqueVenues = new Set(checkins?.map(c => c.venue_id) || []).size;
  
  // Determine vibe persona
  let vibePersona = 'Casual Vibes';
  if (totalVisits >= 10) vibePersona = 'Party Animal 🦁';
  else if (totalVisits >= 5) vibePersona = 'Weekend Warrior ⚡';
  else if (uniqueVenues >= 3) vibePersona = 'Explorer 🌍';
  
  // Create report
  const { data: report, error } = await supabase
    .from('nightlife_reports')
    .insert({
      user_id: userId,
      report_month: `${year}-${String(month).padStart(2, '0')}-01`,
      report_year: year,
      total_visits: totalVisits,
      unique_venues: uniqueVenues,
      vibe_persona: vibePersona,
      percentile: Math.min(99, Math.floor(Math.random() * 50) + 50)
    })
    .select()
    .single();
  
  return { success: !error, report, error };
}

// ============================================
// 6. AI MODERATION
// ============================================

/**
 * Queue content for moderation
 */
export async function queueForModeration(
  contentType: 'story' | 'review' | 'comment',
  contentId: string,
  contentUrl?: string
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('moderation_queue')
    .insert({
      content_type: contentType,
      content_id: contentId,
      content_url: contentUrl,
      status: 'pending'
    })
    .select()
    .single();
  
  return { success: !error, data, error };
}

/**
 * Approve content
 */
export async function approveContent(moderationId: string, reviewerId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', moderationId)
    .select()
    .single();
  
  return { success: !error, data, error };
}

/**
 * Reject content
 */
export async function rejectContent(
  moderationId: string,
  reviewerId: string,
  reason: string
) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      review_notes: reason,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', moderationId)
    .select()
    .single();
  
  // Delete the actual content
  if (!error && data) {
    const { data: modData } = await supabase
      .from('moderation_queue')
      .select('content_type, content_id')
      .eq('id', moderationId)
      .single();
    
    if (modData?.content_type === 'story') {
      await supabase
        .from('nightlife_stories')
        .update({ is_active: false })
        .eq('id', modData.content_id);
    }
  }
  
  return { success: !error, data, error };
}

/**
 * Auto-moderate content (basic)
 */
export async function autoModerateContent(contentId: string, contentType: string) {
  // In production, this would use ML models
  // For now, auto-approve with safe verdict
  const supabase = await getSupabase();
  
  await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      ai_verdict: 'safe',
      moderation_score: 0.95
    })
    .eq('content_id', contentId)
    .eq('content_type', contentType);
  
  return { success: true };
}

// ============================================
// 7. USER PREFERENCES
// ============================================

/**
 * Get user AI settings
 */
export async function getAISettings(userId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ai_user_profiles')
    .select('ai_opt_in')
    .eq('user_id', userId)
    .single();
  
  return { 
    aiOptIn: data?.ai_opt_in ?? true,
    error 
  };
}

/**
 * Toggle AI features on/off
 */
export async function toggleAIOptIn(userId: string, optIn: boolean) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ai_user_profiles')
    .upsert({
      user_id: userId,
      ai_opt_in: optIn,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { success: !error, data, error };
}
