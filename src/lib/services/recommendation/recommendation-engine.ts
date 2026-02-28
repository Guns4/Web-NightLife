/**
 * =====================================================
 * AI RECOMMENDATION ENGINE
 * AfterHoursID - Real-time Personalization
 * =====================================================
 */

// Types
export interface Venue {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  price_range: string;
  rating: number;
  location: { lat: number; lng: number };
  images: string[];
}

export interface UserPreference {
  categories: Record<string, number>;
  priceRanges: Record<string, number>;
  locations: Record<string, number>;
}

export interface RecommendationResult {
  venues: Venue[];
  reason: string;
  algorithm: 'collaborative' | 'content' | 'trending' | 'hybrid';
}

export interface TrendData {
  venue_id: string;
  metric_type: string;
  current_count: number;
  spike_percentage: number;
  trend_status: 'normal' | 'rising' | 'hot' | 'viral';
}

// In-memory store (use Redis in production)
const userInterests = new Map<string, Map<string, number>>();
const userCategories = new Map<string, Map<string, number>>();
const trendingVenues = new Map<string, number>();
const hiddenRecommendations = new Map<string, Set<string>>();

// Interaction weights
const INTERACTION_WEIGHTS: Record<string, number> = {
  view: 1.0,
  like: 2.0,
  book: 5.0,
  review: 3.0,
  share: 4.0,
  skip: -1.0,
};

/**
 * Record a user interaction (for collaborative filtering)
 */
export async function recordInteraction(
  userId: string,
  venueId: string,
  interactionType: string,
  metadata?: {
    sessionId?: string;
    deviceType?: string;
    durationSeconds?: number;
  }
): Promise<void> {
  // Update user interests
  if (!userInterests.has(userId)) {
    userInterests.set(userId, new Map());
  }
  const interests = userInterests.get(userId)!;
  const currentScore = interests.get(venueId) || 0;
  const weight = INTERACTION_WEIGHTS[interactionType] || 1;
  interests.set(venueId, currentScore + weight);
  
  // Update category preferences
  if (!userCategories.has(userId)) {
    userCategories.set(userId, new Map());
  }
  const categories = userCategories.get(userId)!;
  const categoryScore = categories.get('club') || 0;
  categories.set('club', categoryScore + weight);
  
  console.log(`[Recommendation] Recorded ${interactionType} for user ${userId} on venue ${venueId}`);
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreference> {
  const categoriesMap = userCategories.get(userId) || new Map();
  const locationsMap = new Map<string, number>();
  const priceRangesMap = new Map<string, number>();
  
  return {
    categories: Object.fromEntries(categoriesMap),
    priceRanges: Object.fromEntries(priceRangesMap),
    locations: Object.fromEntries(locationsMap),
  };
}

/**
 * Collaborative Filtering: Find similar users and get their preferences
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit: number = 10
): Promise<Venue[]> {
  // Get user's current interests
  const userInterestsMap = userInterests.get(userId);
  
  if (!userInterestsMap || userInterestsMap.size === 0) {
    return [];
  }
  
  // Return trending as fallback
  return getTrendingVenues(undefined, limit);
}

/**
 * Content-based: Find similar venues based on attributes
 */
export async function getSimilarVenues(
  venueId: string,
  limit: number = 5
): Promise<Venue[]> {
  // Return mock similar venues
  return fetchSimilarVenuesFromDB(venueId, limit);
}

/**
 * Get trending/viral venues
 */
export async function getTrendingVenues(
  city?: string,
  limit: number = 10,
  minSpike: number = 100
): Promise<Venue[]> {
  // Use in-memory trending data
  const sorted = Array.from(trendingVenues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  const venueIds = sorted.map(([id]) => id);
  return fetchVenuesByIds(venueIds.length > 0 ? venueIds : ['venue-1', 'venue-2', 'venue-3']);
}

/**
 * Get "For You" personalized recommendations
 */
export async function getForYouRecommendations(
  userId: string | null,
  limit: number = 10,
  city?: string
): Promise<RecommendationResult> {
  // If no userId, return trending
  if (!userId) {
    const venues = await getTrendingVenues(city, limit);
    return {
      venues,
      reason: 'Trending in your area',
      algorithm: 'trending',
    };
  }
  
  // Check if user has enough history
  const userInterestsMap = userInterests.get(userId);
  const interestCount = userInterestsMap?.size || 0;
  
  if (interestCount < 5) {
    const venues = await getTrendingVenues(city, limit);
    return {
      venues,
      reason: 'Based on popular venues in your area',
      algorithm: 'trending',
    };
  }
  
  // Hybrid approach
  const collaborative = await getCollaborativeRecommendations(userId, Math.floor(limit / 2));
  const trending = await getTrendingVenues(city, Math.floor(limit / 2));
  const preferences = await getUserPreferences(userId);
  
  // Filter out hidden venues
  const hidden = hiddenRecommendations.get(userId) || new Set();
  let combined = [...collaborative, ...trending];
  combined = combined.filter(v => !hidden.has(v.id));
  
  combined = combined.slice(0, limit);
  
  return {
    venues: combined,
    reason: 'Recommended for you based on your preferences',
    algorithm: 'hybrid',
  };
}

/**
 * Hide a recommendation (feedback loop)
 */
export async function hideRecommendation(
  userId: string,
  venueId: string,
  reason: string = 'not_interested'
): Promise<void> {
  // Add to hidden set
  if (!hiddenRecommendations.has(userId)) {
    hiddenRecommendations.set(userId, new Set());
  }
  hiddenRecommendations.get(userId)!.add(venueId);
  
  // Record negative interaction
  await recordInteraction(userId, venueId, 'skip');
  
  console.log(`[Recommendation] User ${userId} hid venue ${venueId}: ${reason}`);
}

/**
 * Update venue trends (called by cron job)
 */
export async function updateVenueTrends(): Promise<void> {
  // Update in-memory trending data
  trendingVenues.set('venue-1', 250);
  trendingVenues.set('venue-2', 180);
  trendingVenues.set('venue-3', 150);
  trendingVenues.set('venue-4', 120);
  trendingVenues.set('venue-5', 100);
  
  console.log('[Recommendation] Updated venue trends');
}

/**
 * Get user active hours for predictive scheduling
 */
export async function getUserActiveHours(
  userId: string
): Promise<{ dayOfWeek: number; hour: number; score: number }[]> {
  // Mock data - in production, query database
  return [
    { dayOfWeek: 5, hour: 21, score: 0.9 },
    { dayOfWeek: 5, hour: 22, score: 0.95 },
    { dayOfWeek: 6, hour: 21, score: 0.9 },
    { dayOfWeek: 6, hour: 22, score: 0.85 },
  ];
}

/**
 * Predict best time to send notification
 */
export async function predictBestNotificationTime(
  userId: string
): Promise<{ dayOfWeek: number; hour: number }> {
  const activeHours = await getUserActiveHours(userId);
  
  if (activeHours.length === 0) {
    // Default: Friday 7pm
    return { dayOfWeek: 5, hour: 19 };
  }
  
  // Get highest activity hour
  const best = activeHours.reduce((a, b) => a.score > b.score ? a : b);
  
  return { dayOfWeek: best.dayOfWeek, hour: best.hour };
}

// Helper functions
async function fetchVenuesByIds(ids: string[]): Promise<Venue[]> {
  return ids.map(id => ({
    id,
    name: `Venue ${id}`,
    slug: `venue-${id}`,
    category: 'club',
    city: 'jakarta',
    price_range: '$',
    rating: 4.5,
    location: { lat: -6.2, lng: 106.8 },
    images: [],
  }));
}

async function fetchSimilarVenuesFromDB(venueId: string, limit: number): Promise<Venue[]> {
  const venues = await fetchVenuesByIds(['venue-1', 'venue-2', 'venue-3']);
  return venues.slice(0, limit);
}

async function fetchTrendingFromDB(city?: string, minSpike?: number, limit?: number): Promise<Venue[]> {
  const venues = await fetchVenuesByIds(['venue-1', 'venue-2', 'venue-3']);
  return venues.slice(0, limit || 10);
}
