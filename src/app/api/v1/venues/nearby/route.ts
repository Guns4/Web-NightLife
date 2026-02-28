import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/v1/venues/nearby
 * 
 * Query Parameters:
 * - lat: User's latitude (required)
 * - lng: User's longitude (required)
 * - radius: Search radius in meters (default: 5000)
 * - limit: Number of results (default: 20)
 * - category: Filter by venue category
 * - min_rating: Minimum rating filter
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get query parameters
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '5000');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    
    // Validate required parameters
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid or missing lat/lng parameters' },
        { status: 400 }
      );
    }
    
    // Validate lat/lng ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build the query using PostGIS functions
    let query = supabase.rpc('get_nearby_venues', {
      p_latitude: lat,
      p_longitude: lng,
      p_radius_meters: radius,
      p_limit: limit
    });
    
    // Apply additional filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    if (minRating > 0) {
      query = query.gte('rating', minRating);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('PostGIS query error:', error);
      
      // Fallback to simple lat/lng query if RPC fails
      const fallbackQuery = supabase
        .from('venues')
        .select(`
          id,
          name,
          category,
          city,
          address,
          latitude,
          longitude,
          rating,
          price_range,
          images,
          is_active
        `)
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        return NextResponse.json(
          { error: 'Failed to fetch venues', details: fallbackError.message },
          { status: 500 }
        );
      }
      
      // Calculate distances in JavaScript (fallback)
      const venuesWithDistance = (fallbackData || [])
        .map(venue => ({
          ...venue,
          distance_meters: calculateDistance(
            lat, lng,
            venue.latitude, venue.longitude
          )
        }))
        .filter(v => v.distance_meters <= radius)
        .sort((a, b) => a.distance_meters - b.distance_meters)
        .slice(0, limit);
      
      return NextResponse.json({
        venues: venuesWithDistance,
        source: 'fallback',
        params: { lat, lng, radius, limit }
      });
    }
    
    return NextResponse.json({
      venues: data || [],
      source: 'postgis',
      params: { lat, lng, radius, limit }
    });
    
  } catch (error: any) {
    console.error('Nearby venues error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Haversine formula for calculating distance
 * Used as fallback when PostGIS is not available
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
