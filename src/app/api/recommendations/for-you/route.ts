/**
 * =====================================================
 * RECOMMENDATIONS API - FOR YOU FEED
 * AfterHoursID - AI-Powered Personalization
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForYouRecommendations, recordInteraction, hideRecommendation, getTrendingVenues, getSimilarVenues } from '@/lib/services/recommendation/recommendation-engine';

// GET /api/recommendations/for-you
// Query params: user_id, limit, city

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const city = searchParams.get('city') || undefined;
    
    const recommendations = await getForYouRecommendations(userId, limit, city);
    
    return NextResponse.json({
      success: true,
      ...recommendations,
    });
    
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/recommendations/for-you
// Body: { user_id, venue_id, action, reason? }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, venue_id, action, reason } = body;
    
    if (!user_id || !venue_id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'view':
      case 'like':
      case 'book':
      case 'review':
      case 'share':
        await recordInteraction(user_id, venue_id, action);
        break;
        
      case 'hide':
        await hideRecommendation(user_id, venue_id, reason || 'not_interested');
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Recorded ${action} for venue ${venue_id}`,
    });
    
  } catch (error) {
    console.error('[Recommendations] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
