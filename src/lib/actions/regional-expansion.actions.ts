'use server';

/**
 * REGIONAL EXPANSION ACTIONS - PHASE 6
 * Multi-Region Architecture, Localized Vibes, Tourism Module
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface City {
  id: string;
  name: string;
  slug: string;
  region: string;
  is_tourism_hub: boolean;
  default_currency: string;
  entertainment_tax_rate: number;
}

interface CityVibeCategory {
  category: string;
  display_name: string;
  priority_rank: number;
  is_featured: boolean;
}

interface CityLeaderboardEntry {
  rank: number;
  user_id: string;
  visit_count: number;
  xp_earned: number;
  reward_tier: string;
}

interface CurrencyRate {
  code: string;
  symbol: string;
  exchange_rate_to_idr: number;
}

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 1. MULTI-REGION ARCHITECTURE
// ============================================

/**
 * Get all active cities
 */
export async function getActiveCities(): Promise<City[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) return [];
  return data || [];
}

/**
 * Get city by slug
 */
export async function getCityBySlug(slug: string): Promise<City | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) return null;
  return data;
}

/**
 * Auto-detect user city by geolocation
 */
export async function detectUserCity(
  latitude: number,
  longitude: number
): Promise<City | null> {
  const supabase = getSupabase();
  
  // Use PostGIS for distance calculation
  const { data, error } = await supabase
    .rpc('detect_user_city', {
      user_lat: latitude,
      user_lng: longitude
    });
  
  if (error || !data || data.length === 0) {
    // Default to Jakarta
    return await getCityBySlug('jakarta');
  }
  
  return {
    id: data[0].city_id,
    name: data[0].city_name,
    slug: '',
    region: '',
    is_tourism_hub: false,
    default_currency: 'IDR',
    entertainment_tax_rate: 0.10
  };
}

/**
 * Update user's city preference
 */
export async function setUserCityPreference(
  userId: string,
  cityId: string
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('city_preferences')
    .upsert({
      user_id: userId,
      city_id: cityId
    });
  
  return { success: true };
}

// ============================================
// 2. LOCALIZED VIBE CATEGORIES
// ============================================

/**
 * Get localized venue categories for a city
 */
export async function getCityVibeCategories(citySlug: string): Promise<CityVibeCategory[]> {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return [];
  
  const { data, error } = await supabase
    .from('city_vibe_categories')
    .select('category, display_name, priority_rank, is_featured')
    .eq('city_id', city.id)
    .order('priority_rank');
  
  if (error) return [];
  return data || [];
}

/**
 * Get trending venues in a city
 */
export async function getCityTrendingVenues(
  citySlug: string,
  limit: number = 10
) {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return [];
  
  const { data, error } = await supabase
    .from('city_trending_venues')
    .select(`
      venue_id,
      trending_score,
      trend_direction,
      visit_count_24h,
      venue:venues(
        id, name, category, address, rating, images
      )
    `)
    .eq('city_id', city.id)
    .order('trending_score', { ascending: false })
    .limit(limit);
  
  if (error) return [];
  return data || [];
}

/**
 * Update trending scores for city
 */
export async function updateCityTrending(cityId: string): Promise<void> {
  const supabase = getSupabase();
  
  // Get venues in city with recent activity
  const { data: venues } = await supabase
    .from('venues')
    .select('id')
    .eq('city_id', cityId);
  
  for (const venue of venues || []) {
    // Get 24h visits
    const { count: visits24h } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Get 7d visits
    const { count: visits7d } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    // Get buzz score (simplified)
    const buzzScore = Math.random() * 10;
    
    // Calculate trending score
    const trendingScore = ((visits24h || 0) * 2) + ((visits7d || 0) * 0.5) + (buzzScore * 10);
    
    // Determine trend direction (simplified)
    const trendDirection = Math.random() > 0.5 ? 'up' : 'down';
    
    await supabase
      .from('city_trending_venues')
      .upsert({
        city_id: cityId,
        venue_id: venue.id,
        visit_count_24h: visits24h || 0,
        visit_count_7d: visits7d || 0,
        buzz_score: buzzScore,
        trending_score: trendingScore,
        trend_direction: trendDirection,
        calculated_at: new Date().toISOString()
      });
  }
}

// ============================================
// 3. TOURISM & CURRENCY INTEGRATION
// ============================================

/**
 * Get supported currencies
 */
export async function getCurrencies(): Promise<CurrencyRate[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('currencies')
    .select('code, symbol, exchange_rate_to_idr')
    .eq('is_active', true);
  
  if (error) return [];
  return data || [];
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const supabase = getSupabase();
  
  const { data: fromRate } = await supabase
    .from('currencies')
    .select('exchange_rate_to_idr')
    .eq('code', fromCurrency)
    .single();
  
  const { data: toRate } = await supabase
    .from('currencies')
    .select('exchange_rate_to_idr')
    .eq('code', toCurrency)
    .single();
  
  if (!fromRate || !toRate) return amount;
  
  // Convert: amount in fromCurrency -> IDR -> toCurrency
  const amountInIdr = amount * fromRate.exchange_rate_to_idr;
  return amountInIdr / toRate.exchange_rate_to_idr;
}

/**
 * Translate review using AI
 */
export async function translateReview(
  reviewId: string,
  targetLanguage: string
): Promise<string> {
  const supabase = getSupabase();
  
  // Get original review
  const { data: review } = await supabase
    .from('vibe_checks')
    .select('comment')
    .eq('id', reviewId)
    .single();
  
  if (!review) return '';
  
  // Mock translation (would use LLM in production)
  const translatedText = `[Translated to ${targetLanguage}] ${review.comment}`;
  
  // Store translation
  await supabase
    .from('translated_reviews')
    .insert({
      original_review_id: reviewId,
      original_language: 'id',
      translated_text: translatedText,
      translated_language: targetLanguage,
      translation_confidence: 0.95
    });
  
  return translatedText;
}

/**
 * Get translation for review
 */
export async function getReviewTranslation(
  reviewId: string,
  targetLanguage: string
): Promise<string | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('translated_reviews')
    .select('translated_text')
    .eq('original_review_id', reviewId)
    .eq('translated_language', targetLanguage)
    .single();
  
  if (error || !data) return null;
  return data.translated_text;
}

// ============================================
// 4. REGIONAL CITY MAYOR LEADERBOARD
// ============================================

/**
 * Get city leaderboard
 */
export async function getCityLeaderboard(
  citySlug: string,
  period: 'weekly' | 'monthly' = 'weekly',
  limit: number = 50
): Promise<CityLeaderboardEntry[]> {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return [];
  
  // Determine period
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;
  
  if (period === 'weekly') {
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  
  const { data, error } = await supabase
    .from('city_leaderboard')
    .select(`
      rank,
      user_id,
      visit_count,
      xp_earned,
      reward_tier,
      user:user_id(
        id,
        username,
        avatar_url
      )
    `)
    .eq('city_id', city.id)
    .eq('period_type', period)
    .gte('period_start', periodStart.toISOString().split('T')[0])
    .lte('period_end', periodEnd.toISOString().split('T')[0])
    .order('rank')
    .limit(limit);
  
  if (error) return [];
  return data || [];
}

/**
 * Get user's rank in city
 */
export async function getUserCityRank(
  userId: string,
  citySlug: string,
  period: 'weekly' | 'monthly' = 'weekly'
): Promise<number | null> {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return null;
  
  const { data, error } = await supabase
    .from('city_leaderboard')
    .select('rank')
    .eq('city_id', city.id)
    .eq('user_id', userId)
    .eq('period_type', period)
    .single();
  
  if (error) return null;
  return data?.rank || null;
}

/**
 * Get city rewards
 */
export async function getCityRewards(citySlug: string) {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return [];
  
  const { data, error } = await supabase
    .from('city_rewards')
    .select('*')
    .eq('city_id', city.id)
    .eq('is_active', true)
    .order('rank_required');
  
  if (error) return [];
  return data || [];
}

// ============================================
// 5. REGIONAL AD-NETWORK
// ============================================

/**
 * Create regional ad campaign
 */
export async function createRegionalAdCampaign(
  venueId: string,
  ownerId: string,
  campaignData: {
    name: string;
    targetCities: string[];
    dailyBudget: number;
    targetTravelingUsers?: boolean;
  }
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  // Convert city slugs to IDs
  const { data: cities } = await supabase
    .from('cities')
    .select('id')
    .in('slug', campaignData.targetCities);
  
  await supabase
    .from('regional_ad_campaigns')
    .insert({
      venue_id: venueId,
      owner_id: ownerId,
      target_cities: cities?.map(c => c.id) || [],
      target_traveling_users: campaignData.targetTravelingUsers || false,
      daily_budget: campaignData.dailyBudget,
      status: 'active',
      started_at: new Date().toISOString()
    });
  
  return { success: true };
}

/**
 * Get regional ad campaigns for venue
 */
export async function getRegionalAdCampaigns(venueId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('regional_ad_campaigns')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

/**
 * Detect travel patterns
 */
export async function detectTravelPattern(
  userId: string,
  searchCity: string
): Promise<{ isTraveling: boolean; confidence: number }> {
  const supabase = getSupabase();
  
  // Get user's home city
  const { data: homeCity } = await supabase
    .from('travel_patterns')
    .select('home_city_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (!homeCity) {
    // First detection - set home city
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', searchCity)
      .single();
    
    if (city) {
      await supabase
        .from('travel_patterns')
        .insert({
          user_id: userId,
          home_city_id: city.id,
          detection_type: 'search',
          confidence_score: 0.5
        });
    }
    
    return { isTraveling: false, confidence: 0 };
  }
  
  // Check if searching different city
  const { data: searchCityData } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', searchCity)
    .single();
  
  if (!searchCityData || searchCityData.id === homeCity.home_city_id) {
    return { isTraveling: false, confidence: 0 };
  }
  
  // Mark as traveling
  await supabase
    .from('travel_patterns')
    .insert({
      user_id: userId,
      home_city_id: homeCity.home_city_id,
      detected_city_id: searchCityData.id,
      detection_type: 'search',
      confidence_score: 0.8,
      travel_date: new Date().toISOString().split('T')[0]
    });
  
  return { isTraveling: true, confidence: 0.8 };
}

// ============================================
// 6. REGIONAL TAX & SEO
// ============================================

/**
 * Get regional tax configuration
 */
export async function getRegionalTaxConfig(citySlug: string) {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id, entertainment_tax_rate')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return null;
  
  const { data, error } = await supabase
    .from('regional_tax_config')
    .select('*')
    .eq('city_id', city.id)
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();
  
  return {
    city_id: city.id,
    entertainment_tax_rate: data?.entertainment_tax_rate || city.entertainment_tax_rate,
    service_charge_rate: data?.service_charge_rate || 0.10,
    venue_type_rates: data?.venue_type_rates || {}
  };
}

/**
 * Get city SEO settings
 */
export async function getCitySEOSettings(citySlug: string) {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id, name')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return null;
  
  const { data, error } = await supabase
    .from('city_seo_settings')
    .select('*')
    .eq('city_id', city.id)
    .single();
  
  if (error || !data) {
    // Return default SEO
    return {
      meta_title: `Best Nightlife in ${city.name} 2026 | NightLife Indonesia`,
      meta_description: `Discover the best clubs, KTV, and bars in ${city.name}. Real reviews, live vibes, and exclusive deals.`,
      meta_keywords: [`nightlife ${city.name}`, `clubs ${city.name}`, `KTV ${city.name}`]
    };
  }
  
  return data;
}

/**
 * Generate dynamic meta tags
 */
export async function generateDynamicMetaTags(
  citySlug: string,
  category?: string
): Promise<Record<string, string>> {
  const seo = await getCitySEOSettings(citySlug);
  const city = await getCityBySlug(citySlug);
  
  const title = category
    ? `Best ${category} in ${city?.name || 'Indonesia'} 2026 | NightLife`
    : seo?.meta_title || 'NightLife Indonesia';
  
  const description = category
    ? `Find the hottest ${category} venues in ${city?.name || 'Indonesia'}. Real reviews, live vibes, and exclusive deals.`
    : seo?.meta_description || '';
  
  return {
    title,
    description,
    keywords: seo?.meta_keywords?.join(', ') || ''
  };
}
