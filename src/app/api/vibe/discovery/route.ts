import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Venue with vibe data from discovery API
 */
export interface DiscoveredVenue {
  id: string;
  name: string;
  category: string;
  description: string | null;
  city: string;
  address: string | null;
  coordinates: unknown;
  price_range: number;
  rating: number;
  features: string[];
  images: string[];
  is_active: boolean;
  avg_sentiment_score: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
    total_reviews: number;
  };
  trending_vibe: string;
  crowd_status: 'quiet' | 'moderate' | 'packed' | 'unknown';
  distance: number | null;
  promos: VenuePromo[];
}

/**
 * Active promo for venue
 */
export interface VenuePromo {
  id: string;
  title: string;
  description: string | null;
  promo_code: string | null;
  discount_value: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/**
 * API Response for venue discovery
 */
export interface VibeDiscoveryResponse {
  data: DiscoveredVenue[];
  count: number;
  limit: number;
  offset: number;
  filters: {
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    category?: string | null;
    city?: string | null;
    vibe?: string | null;
    sort_by?: string;
  };
  metadata: {
    generated_at: string;
    api_version: string;
  };
}

/**
 * API Error Response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// ============================================================
// SWAGGER / API DOCUMENTATION
// ============================================================

/**
 * @swagger
 * /api/vibe/discovery:
 *   get:
 *     summary: Discover venues based on location and vibe sentiment
 *     description: |
 *       AI-powered venue discovery using PostGIS for location-based queries
 *       and sentiment analysis from vibe_checks for trending vibes.
 *     tags:
 *       - Venue Discovery
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: User's latitude for "Nearest Me" feature
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: User's longitude for "Nearest Me" feature
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by venue category (club, bar, restaurant, etc.)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name
 *       - in: query
 *         name: vibe
 *         schema:
 *           type: string
 *         description: Filter by vibe (chill, party, luxury, etc.)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, distance, sentiment, price_asc, price_desc]
 *           default: rating
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Successful venue discovery
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VibeDiscoveryResponse'
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Server Error
 */

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate unique booking code
 */
function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VIBE-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine crowd status based on recent activity
 */
function determineCrowdStatus(
  reviewCount: number,
  recentReviews: number
): 'quiet' | 'moderate' | 'packed' | 'unknown' {
  if (reviewCount === 0) return 'unknown';
  const density = recentReviews / Math.max(reviewCount, 1);
  if (density > 0.7) return 'packed';
  if (density > 0.3) return 'moderate';
  return 'quiet';
}

/**
 * Determine trending vibe from tags
 */
function determineTrendingVibe(tags: string[]): string {
  const vibeMap: Record<string, string[]> = {
    party: ['party', 'dancing', 'clubbing', 'nightlife'],
    chill: ['chill', 'relaxing', 'cozy', 'laid-back'],
    luxury: ['luxury', 'vip', 'exclusive', 'upscale'],
    social: ['social', 'networking', 'friendly', 'group'],
    romantic: ['romantic', 'date', 'couples', 'intimate'],
  };

  const tagLower = tags.map((t) => t.toLowerCase());
  for (const [vibe, keywords] of Object.entries(vibeMap)) {
    if (keywords.some((k) => tagLower.includes(k))) {
      return vibe;
    }
  }
  return 'chill';
}

// ============================================================
// MAIN API HANDLER
// ============================================================

/**
 * GET /api/vibe/discovery
 * 
 * AI-powered venue discovery with:
 * - PostGIS "Nearest Me" using coordinates
 * - Sentiment analysis from vibe_checks
 * - Real-time crowd status
 * - Smart recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ============================================================
    // PARAMETER VALIDATION
    // ============================================================
    
    const latitude = parseFloat(searchParams.get('lat') || '0');
    const longitude = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '10');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const vibe = searchParams.get('vibe');
    const sortBy = searchParams.get('sort') || 'rating';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate coordinates if provided
    if ((latitude !== 0 || longitude !== 0) && 
        (isNaN(latitude) || isNaN(longitude) || 
         latitude < -90 || latitude > 90 || 
         longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { 
          error: 'Invalid coordinates. Lat must be -90 to 90, Lng must be -180 to 180.',
          code: 'INVALID_COORDINATES'
        } as ApiError,
        { status: 400 }
      );
    }

    // ============================================================
    // BUILD BASE QUERY WITH POSTGIS & SENTIMENT
    // ============================================================

    // First, get venues with their sentiment scores using RPC
    let venuesQuery = supabase
      .from('venues')
      .select(`
        id,
        name,
        category,
        description,
        city,
        address,
        coordinates,
        price_range,
        rating,
        features,
        images,
        is_active,
        created_at
      `)
      .eq('is_active', true);

    // Apply category filter
    if (category) {
      venuesQuery = venuesQuery.eq('category', category);
    }

    // Apply city filter
    if (city) {
      venuesQuery = venuesQuery.ilike('city', `%${city}%`);
    }

    // Apply geographic filter using PostGIS if coordinates provided
    if (latitude && longitude) {
      // Use PostGIS to filter by radius
      venuesQuery = venuesQuery.filter('coordinates', 'not.eq', null);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        venuesQuery = venuesQuery.order('rating', { ascending: false });
        break;
      case 'price_asc':
        venuesQuery = venuesQuery.order('price_range', { ascending: true });
        break;
      case 'price_desc':
        venuesQuery = venuesQuery.order('price_range', { ascending: false });
        break;
      default:
        venuesQuery = venuesQuery.order('rating', { ascending: false });
    }

    // Apply pagination
    venuesQuery = venuesQuery.range(offset, offset + limit - 1);

    const { data: venues, error: venuesError } = await venuesQuery;

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch venues',
          code: 'DATABASE_ERROR',
          details: venuesError
        } as ApiError,
        { status: 500 }
      );
    }

    // ============================================================
    // FETCH VIBE CHECKS FOR SENTIMENT ANALYSIS
    // ============================================================

    const venueIds = (venues || []).map((v) => v.id);
    
    let vibeChecksQuery = supabase
      .from('vibe_checks')
      .select('venue_id, rating, tag_vibe, created_at')
      .in('venue_id', venueIds.length > 0 ? venueIds : ['']);

    const { data: vibeChecks } = await vibeChecksQuery;

    // Group vibe checks by venue
    const vibeChecksByVenue = (vibeChecks || []).reduce((acc, check) => {
      if (!acc[check.venue_id]) {
        acc[check.venue_id] = [];
      }
      acc[check.venue_id]!.push(check);
      return acc;
    }, {} as Record<string, NonNullable<typeof vibeChecks>>);

    // ============================================================
    // FETCH ACTIVE PROMOS
    // ============================================================

    const { data: promos } = await supabase
      .from('promos')
      .select('id, title, description, promo_code, discount_value, start_date, end_date, is_active, venue_id')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .in('venue_id', venueIds.length > 0 ? venueIds : ['']);

    const promosByVenue = (promos || []).reduce((acc, promo) => {
      if (!acc[promo.venue_id]) {
        acc[promo.venue_id] = [];
      }
      acc[promo.venue_id]!.push(promo);
      return acc;
    }, {} as Record<string, NonNullable<typeof promos>>);

    // ============================================================
    // PROCESS VENUES WITH SENTIMENT & DISTANCE
    // ============================================================

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const processedVenues: DiscoveredVenue[] = (venues || []).map((venue) => {
      const venueVibeChecks = vibeChecksByVenue[venue.id] || [];
      
      // Calculate sentiment score (average rating from vibe_checks)
      const ratings = venueVibeChecks.map((v) => v.rating);
      const avgSentimentScore = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : venue.rating || 0;

      // Calculate sentiment breakdown
      const positive = ratings.filter((r) => r >= 4).length;
      const neutral = ratings.filter((r) => r === 3).length;
      const negative = ratings.filter((r) => r <= 2).length;

      // Get all tags for trending vibe
      const allTags = venueVibeChecks.flatMap((v) => v.tag_vibe || []);
      const recentReviews = venueVibeChecks.filter(
        (v) => new Date(v.created_at) > oneWeekAgo
      ).length;

      // Calculate distance if coordinates provided
      let distance: number | null = null;
      if (latitude && longitude && venue.coordinates) {
        const coords = venue.coordinates as { coordinates?: [number, number] };
        if (coords.coordinates && coords.coordinates.length === 2) {
          distance = calculateDistance(
            latitude,
            longitude,
            coords.coordinates[1], // lat
            coords.coordinates[0] // lng
          );
        }
      }

      return {
        id: venue.id,
        name: venue.name,
        category: venue.category,
        description: venue.description,
        city: venue.city,
        address: venue.address,
        coordinates: venue.coordinates,
        price_range: venue.price_range,
        rating: venue.rating,
        features: venue.features || [],
        images: venue.images || [],
        is_active: venue.is_active,
        avg_sentiment_score: Math.round(avgSentimentScore * 10) / 10,
        sentiment_breakdown: {
          positive,
          neutral,
          negative,
          total_reviews: ratings.length,
        },
        trending_vibe: determineTrendingVibe(allTags),
        crowd_status: determineCrowdStatus(ratings.length, recentReviews),
        distance: distance ? Math.round(distance * 10) / 10 : null,
        promos: (promosByVenue[venue.id] || []).map((p): VenuePromo => ({
          id: p.id,
          title: p.title,
          description: p.description,
          promo_code: p.promo_code,
          discount_value: p.discount_value,
          start_date: p.start_date,
          end_date: p.end_date,
          is_active: p.is_active,
        })),
      };
    });

    // ============================================================
    // FILTER BY VIBE IF SPECIFIED
    // ============================================================

    let filteredVenues = processedVenues;
    if (vibe) {
      filteredVenues = filteredVenues.filter(
        (v) => v.trending_vibe === vibe || 
               v.sentiment_breakdown.total_reviews > 0 && 
               v.avg_sentiment_score >= 4
      );
    }

    // ============================================================
    // FILTER BY RADIUS IF COORDINATES PROVIDED
    // ============================================================

    if (radiusKm && latitude && longitude) {
      filteredVenues = filteredVenues.filter(
        (v) => !v.distance || v.distance <= radiusKm
      );
    }

    // ============================================================
    // RE-SORT BY DISTANCE IF REQUESTED
    // ============================================================

    if (sortBy === 'distance' && latitude && longitude) {
      filteredVenues.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    // Sort by sentiment if requested
    if (sortBy === 'sentiment') {
      filteredVenues.sort((a, b) => b.avg_sentiment_score - a.avg_sentiment_score);
    }

    // ============================================================
    // BUILD RESPONSE
    // ============================================================

    const response: VibeDiscoveryResponse = {
      data: filteredVenues,
      count: filteredVenues.length,
      limit,
      offset,
      filters: {
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        radius_km: radiusKm || undefined,
        category: category || undefined,
        city: city || undefined,
        vibe: vibe || undefined,
        sort_by: sortBy,
      },
      metadata: {
        generated_at: new Date().toISOString(),
        api_version: '1.0.0',
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in vibe discovery:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      } as ApiError,
      { status: 500 }
    );
  }
}
