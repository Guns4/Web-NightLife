/**
 * =====================================================
 * SIMILAR VENUES API
 * AfterHoursID - Content-based Recommendations
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSimilarVenues, getTrendingVenues } from '@/lib/services/recommendation/recommendation-engine';

// GET /api/recommendations/similar
// Query params: venue_id, limit

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const venueId = searchParams.get('venue_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const type = searchParams.get('type') || 'similar'; // 'similar' or 'trending'
    
    let venues;
    
    if (type === 'trending') {
      const city = searchParams.get('city') || undefined;
      venues = await getTrendingVenues(city, limit);
    } else if (venueId) {
      venues = await getSimilarVenues(venueId, limit);
    } else {
      return NextResponse.json(
        { success: false, error: 'venue_id required for similar type' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      venues,
      type: type === 'trending' ? 'trending' : 'similar',
      algorithm: type === 'trending' ? 'trend_detection' : 'content_similarity',
    });
    
  } catch (error) {
    console.error('[Similar Venues] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get similar venues' },
      { status: 500 }
    );
  }
}
