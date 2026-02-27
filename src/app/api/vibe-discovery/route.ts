import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/vibe-discovery
 * AI-powered venue discovery with smart recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filter parameters
    const latitude = parseFloat(searchParams.get('lat') || '0');
    const longitude = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '10');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const priceRange = searchParams.get('price_range');
    const vibe = searchParams.get('vibe'); // e.g., 'chill', 'party', 'luxury'
    const openNow = searchParams.get('open_now') === 'true';
    const sortBy = searchParams.get('sort') || 'rating'; // rating, distance, price, popularity
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build base query
    let query = supabase
      .from('venues')
      .select(`
        *,
        promos:promos(
          id, title, description, promo_code, discount_value, 
          start_date, end_date, is_active
        ),
        vibe_checks:vibe_checks(
          id, rating, comment, tags, created_at
        )
      `)
      .eq('is_active', true)
      .eq('status', 'active');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (min) query = query.gte('price_range', min);
      if (max) query = query.lte('price_range', max);
    }

    // Geographic filtering (PostGIS)
    if (latitude && longitude && radiusKm) {
      query = query.filter('coordinates', 'not.eq', null);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'popularity':
        query = query.order('review_count', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price_range', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_range', { ascending: false });
        break;
      default:
        query = query.order('rating', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: venues, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Process venues and calculate additional metrics
    const processedVenues = (venues || []).map((venue: any) => {
      // Calculate vibe score based on reviews
      const ratings = venue.vibe_checks?.map((v: any) => v.rating) || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
        : venue.rating || 0;

      // Extract popular tags
      const allTags = venue.vibe_checks?.flatMap((v: any) => v.tags || []) || [];
      const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      const topTags = Object.entries(tagCounts as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      // Check if open now
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      const hours = venue.opening_hours as Record<string, { open: string; close: string }>;
      const todayHours = hours?.[Object.keys(hours)[dayOfWeek]];
      const isOpen = todayHours 
        ? currentTime >= todayHours.open && currentTime <= todayHours.close
        : false;

      // Determine vibe category
      let detectedVibe = 'chill';
      if (topTags.includes('party') || topTags.includes('dancing')) {
        detectedVibe = 'party';
      } else if (topTags.includes('luxury') || topTags.includes('vip')) {
        detectedVibe = 'luxury';
      } else if (topTags.includes('chill') || topTags.includes('relaxing')) {
        detectedVibe = 'chill';
      }

      // Calculate distance if coordinates provided
      let distance = null;
      if (latitude && longitude && venue.coordinates) {
        // Simple distance calculation (Haversine would be more accurate)
        const venueLat = (venue.coordinates as any).coordinates?.[1] || 0;
        const venueLng = (venue.coordinates as any).coordinates?.[0] || 0;
        distance = Math.sqrt(
          Math.pow(venueLat - latitude, 2) + Math.pow(venueLng - longitude, 2)
        ) * 111; // Approximate km
      }

      return {
        ...venue,
        avg_rating: Math.round(avgRating * 10) / 10,
        review_count: ratings.length || venue.review_count || 0,
        top_tags: topTags,
        is_open: isOpen,
        detected_vibe: detectedVibe,
        distance: distance ? Math.round(distance * 10) / 10 : null,
        has_promo: venue.promos?.some((p: any) => p.is_active) || false,
      };
    });

    // Filter by vibe if specified
    let filteredVenues = processedVenues;
    if (vibe) {
      filteredVenues = processedVenues.filter(
        (v: any) => v.detected_vibe === vibe || v.top_tags.includes(vibe)
      );
    }

    // Filter open now if requested
    if (openNow) {
      filteredVenues = filteredVenues.filter((v: any) => v.is_open);
    }

    // Filter by radius if coordinates provided
    if (radiusKm && latitude && longitude) {
      filteredVenues = filteredVenues.filter(
        (v: any) => !v.distance || v.distance <= radiusKm
      );
    }

    // Re-sort by distance if specified
    if (sortBy === 'distance' && latitude && longitude) {
      filteredVenues.sort((a: any, b: any) => (a.distance || 999) - (b.distance || 999));
    }

    return NextResponse.json({
      data: filteredVenues,
      count: count || filteredVenues.length,
      limit,
      offset,
      filters: {
        category,
        city,
        priceRange,
        vibe,
        openNow,
        sortBy,
        radiusKm,
      },
    });
  } catch (error) {
    console.error('Error in vibe discovery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vibe-discovery
 * Get personalized recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      latitude,
      longitude,
      preferences,
      history,
    } = body;

    // Build recommendation query
    let query = supabase
      .from('venues')
      .select(`
        *,
        promos:promos(
          id, title, description, promo_code, discount_value
        ),
        vibe_checks:vibe_checks(
          id, rating, tags
        )
      `)
      .eq('is_active', true)
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .limit(20);

    // If user has preferences, apply them
    if (preferences) {
      if (preferences.category) {
        query = query.eq('category', preferences.category);
      }
      if (preferences.priceRange) {
        const [min, max] = preferences.priceRange.split('-').map(Number);
        if (min) query = query.gte('price_range', min);
        if (max) query = query.lte('price_range', max);
      }
      if (preferences.vibe) {
        // Would need to join with vibe_checks for tag filtering
      }
    }

    const { data: venues, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Score venues based on user history
    const scoredVenues = (venues || []).map((venue: any) => {
      let score = venue.rating || 0;
      
      // Boost score based on user's past visits
      if (history?.visited_venues?.includes(venue.id)) {
        score += 2;
      }
      
      // Boost score based on similar venues visited
      if (history?.preferred_categories?.includes(venue.category)) {
        score += 1;
      }

      // Boost if has active promos
      if (venue.promos?.length > 0) {
        score += 0.5;
      }

      return {
        ...venue,
        recommendation_score: Math.round(score * 10) / 10,
      };
    });

    // Sort by recommendation score
    scoredVenues.sort((a: any, b: any) => b.recommendation_score - a.recommendation_score);

    return NextResponse.json({
      data: scoredVenues.slice(0, 10),
      message: user_id ? 'Personalized recommendations' : 'Trending venues',
    });
  } catch (error) {
    console.error('Error in recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
