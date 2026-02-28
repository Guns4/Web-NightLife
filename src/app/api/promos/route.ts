/**
 * =====================================================
 * PROMO API ROUTES
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActivePromos, searchPromos, trackImpression, trackClick } from '@/lib/services/promo-service';

// GET /api/promos - Get active promos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const promoId = searchParams.get('id');
    
    // Track impression
    if (action === 'impression' && promoId) {
      await trackImpression(promoId);
      return NextResponse.json({ success: true });
    }
    
    // Track click
    if (action === 'click' && promoId) {
      await trackClick(promoId);
      return NextResponse.json({ success: true });
    }
    
    // Search promos
    if (action === 'search' && query) {
      const promos = await searchPromos(query);
      return NextResponse.json({ promos });
    }
    
    // Get active promos (default)
    const promos = await getActivePromos(limit);
    return NextResponse.json({ promos });
    
  } catch (error) {
    console.error('Promo API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promos' },
      { status: 500 }
    );
  }
}
