/**
 * =====================================================
 * PARTNER API - DISCOVERY ENDPOINT
 * AfterHoursID - B2B Partner Platform
 * Returns venues with partner-specific branding
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { partnerAuthBasic, getRateLimitHeaders, logPartnerResponse, type PartnerContext } from '@/lib/middleware/partner-auth';

// GET /api/v1/partners/discovery
// Query params: city, category, lat, lng, radius, limit, offset, include

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let context: PartnerContext | null = null;
  let response: NextResponse | null = null;
  
  try {
    // Authenticate partner
    const authResult = await partnerAuthBasic(request);
    context = authResult.context;
    response = authResult.response;
    
    if (response) {
      return response;
    }
    
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseInt(searchParams.get('radius') || '5000');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const include = searchParams.get('include')?.split(',') || [];
    
    // Build filters
    const filters: Record<string, unknown> = {
      status: 'active',
    };
    
    if (city) {
      filters.city = city.toLowerCase();
    }
    
    if (category) {
      filters.category = category;
    }
    
    // Geo location filtering
    let geoFilter = null;
    if (lat && lng) {
      geoFilter = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius,
      };
    }
    
    // Fetch venues (mock - in production, query actual database)
    const venues = await fetchPartnerVenues({
      filters,
      geoFilter,
      limit,
      offset,
      include,
      partnerId: context!.partner.id,
    });
    
    // Apply partner branding if configured
    const branding = {
      primaryColor: context!.partner.primary_color || '#FFD700',
      customDomain: context!.partner.custom_domain,
    };
    
    // Build response
    const result = {
      success: true,
      data: {
        venues: venues.map(venue => ({
          ...venue,
          _partner: {
            branding,
          },
        })),
        pagination: {
          limit,
          offset,
          total: venues.length, // Would be actual total count
        },
      },
      meta: {
        partner: {
          id: context!.partner.id,
          name: context!.partner.name,
          tier: context!.partner.tier,
        },
        rateLimit: {
          remaining: context!.rateLimit.remaining,
          reset: Math.ceil(context!.rateLimit.resetTime / 1000),
        },
      },
    };
    
    response = NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
        ...getRateLimitHeaders(context!.rateLimit),
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('[Partner Discovery] Error:', error);
    
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
    
    // Log the error
    if (context) {
      await logPartnerResponse(request, errorResponse, context, startTime, error as Error);
    }
    
    return errorResponse;
  } finally {
    // Log the request
    if (context && response) {
      await logPartnerResponse(request, response, context, startTime);
    }
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Fetch venues for partner (mock implementation)
 */
async function fetchPartnerVenues(params: {
  filters: Record<string, unknown>;
  geoFilter: { lat: number; lng: number; radius: number } | null;
  limit: number;
  offset: number;
  include: string[];
  partnerId: string;
}) {
  // In production, this would query the database with Prisma
  // and apply geo-spatial filtering
  
  // Mock venues data
  const mockVenues = [
    {
      id: 'venue-1',
      name: 'Dragonfly Club',
      slug: 'dragonfly-club',
      description: 'Premium nightlife destination in Jakarta',
      category: 'club',
      city: 'jakarta',
      address: 'Jalan Kemang Timur No. 64',
      location: { lat: -6.2618, lng: 106.8106 },
      images: ['https://example.com/dragonfly.jpg'],
      rating: 4.5,
      review_count: 234,
      price_range: '$$$',
      opening_hours: { monday: '22:00-04:00' },
      amenities: ['vip', 'dj', 'dance_floor'],
      contact: { phone: '+6221719544' },
    },
    {
      id: 'venue-2',
      name: 'Basement Jakarta',
      slug: 'basement-jakarta',
      description: 'Underground electronic music venue',
      category: 'club',
      city: 'jakarta',
      address: 'Jalan Kemang Selatan No. 16',
      location: { lat: -6.2625, lng: 106.8110 },
      images: ['https://example.com/basement.jpg'],
      rating: 4.3,
      review_count: 189,
      price_range: '$$',
      opening_hours: { friday: '22:00-05:00', saturday: '22:00-05:00' },
      amenities: ['dj', 'dance_floor', 'smoking_area'],
    },
    {
      id: 'venue-3',
      name: 'Colony Surabaya',
      slug: 'colony-surabaya',
      description: 'Premier rooftop bar and lounge',
      category: 'bar',
      city: 'surabaya',
      address: 'Jalan Raya Surabaya No. 1',
      location: { lat: -7.2575, lng: 112.7521 },
      images: ['https://example.com/colony.jpg'],
      rating: 4.7,
      review_count: 456,
      price_range: '$$$',
      opening_hours: { daily: '18:00-02:00' },
      amenities: ['rooftop', 'live_music', 'vip'],
    },
  ];
  
  // Apply filters
  let filtered = mockVenues;
  
  if (params.filters.city) {
    filtered = filtered.filter(v => v.city === params.filters.city);
  }
  
  if (params.filters.category) {
    filtered = filtered.filter(v => v.category === params.filters.category);
  }
  
  // Apply geo filter (simplified)
  if (params.geoFilter) {
    // In production, use PostGIS for proper geo queries
    filtered = filtered.filter(v => {
      if (!v.location) return false;
      const distance = calculateDistance(
        params.geoFilter!.lat,
        params.geoFilter!.lng,
        v.location.lat,
        v.location.lng
      );
      return distance <= params.geoFilter!.radius;
    });
  }
  
  // Apply pagination
  return filtered.slice(params.offset, params.offset + params.limit);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}
