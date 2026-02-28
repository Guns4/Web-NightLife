/**
 * =====================================================
 * PARTNER API - REALTIME PROMOS ENDPOINT
 * AfterHoursID - B2B Partner Platform
 * Data stream for live widgets
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { partnerAuthPromos, getRateLimitHeaders, logPartnerResponse, type PartnerContext } from '@/lib/middleware/partner-auth';

// GET /api/v1/partners/promos/realtime
// Query params: venue_id, city, category, status, limit, offset

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let context: PartnerContext | null = null;
  let response: NextResponse | null = null;
  
  try {
    // Authenticate partner
    const authResult = await partnerAuthPromos(request);
    context = authResult.context;
    response = authResult.response;
    
    if (response) {
      return response;
    }
    
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const venueId = searchParams.get('venue_id');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build filters
    const filters: Record<string, unknown> = { status };
    
    if (venueId) filters.venue_id = venueId;
    if (city) filters.city = city.toLowerCase();
    if (category) filters.category = category;
    
    // Fetch promos
    const promos = await fetchPartnerPromos({
      filters,
      limit,
      offset,
      partnerId: context!.partner.id,
    });
    
    // Get VVIP/Featured promos
    const featuredPromos = promos.filter((p: { featured: boolean; is_vip: boolean }) => p.featured || p.is_vip);
    
    // Build response
    const result = {
      success: true,
      data: {
        promos,
        featured: featuredPromos,
        pagination: { limit, offset, total: promos.length },
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
        timestamp: new Date().toISOString(),
      },
    };
    
    response = NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
        ...getRateLimitHeaders(context!.rateLimit),
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('[Partner Promos] Error:', error);
    
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'An error occurred' },
      { status: 500 }
    );
    
    if (context) {
      await logPartnerResponse(request, errorResponse, context, startTime, error as Error);
    }
    
    return errorResponse;
  } finally {
    if (context && response) {
      await logPartnerResponse(request, response, context, startTime);
    }
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
    },
  });
}

/**
 * Fetch promos for partner (mock)
 */
async function fetchPartnerPromos(params: {
  filters: Record<string, unknown>;
  limit: number;
  offset: number;
  partnerId: string;
}) {
  // Mock promos data
  return [
    {
      id: 'promo-1',
      title: 'VIP Entry + Free Drink',
      description: 'Exclusive VIP entry with complimentary welcome drink',
      venue: { id: 'venue-1', name: 'Dragonfly Club', slug: 'dragonfly-club', city: 'jakarta' },
      category: 'vip_access',
      discount_percentage: 20,
      original_price: 500000,
      discounted_price: 400000,
      currency: 'IDR',
      valid_from: '2024-01-01T00:00:00Z',
      valid_until: '2024-12-31T23:59:59Z',
      status: 'active',
      featured: true,
      is_vip: true,
      max_redeem: 100,
      redeemed_count: 45,
      image_url: 'https://example.com/promo-vip.jpg',
      terms: 'Valid for single entry.',
      tags: ['vip', 'drinks', 'exclusive'],
    },
    {
      id: 'promo-2',
      title: 'Happy Hour 50% Off',
      description: '50% off all cocktails from 8PM-10PM',
      venue: { id: 'venue-2', name: 'Basement Jakarta', slug: 'basement-jakarta', city: 'jakarta' },
      category: 'drinks',
      discount_percentage: 50,
      original_price: 150000,
      discounted_price: 75000,
      currency: 'IDR',
      status: 'active',
      featured: false,
      is_vip: false,
      max_redeem: 200,
      redeemed_count: 156,
      image_url: 'https://example.com/promo-happyhour.jpg',
      tags: ['happy_hour', 'cocktails'],
    },
    {
      id: 'promo-3',
      title: 'Ladies Night Free Entry',
      description: 'Free entry for ladies before 11PM',
      venue: { id: 'venue-3', name: 'Colony Surabaya', slug: 'colony-surabaya', city: 'surabaya' },
      category: 'ladies_night',
      discount_percentage: 100,
      original_price: 200000,
      discounted_price: 0,
      currency: 'IDR',
      status: 'active',
      featured: true,
      is_vip: false,
      max_redeem: 500,
      redeemed_count: 312,
      image_url: 'https://example.com/promo-ladies.jpg',
      tags: ['ladies_night', 'free'],
    },
  ];
}
