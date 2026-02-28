/**
 * =====================================================
 * PROMO API ROUTE (SINGLE)
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPromo, activatePromo, pausePromo, updatePromoStatus } from '@/lib/services/promo-service';
import { PromoTier } from '@/lib/services/promo-service';

// GET /api/promos/[id] - Get single promo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promo = await getPromo(id);
    
    if (!promo) {
      return NextResponse.json(
        { error: 'Promo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ promo });
  } catch (error) {
    console.error('Get promo error:', error);
    return NextResponse.json(
      { error: 'Failed to get promo' },
      { status: 500 }
    );
  }
}

// PATCH /api/promos/[id] - Update promo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, tier } = body;
    
    let promo;
    
    if (status === 'activate') {
      promo = await activatePromo(id);
    } else if (status === 'pause') {
      promo = await pausePromo(id);
    } else if (status) {
      promo = await updatePromoStatus(id, status as any);
    }
    
    if (!promo) {
      return NextResponse.json(
        { error: 'Promo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ promo });
  } catch (error) {
    console.error('Update promo error:', error);
    return NextResponse.json(
      { error: 'Failed to update promo' },
      { status: 500 }
    );
  }
}
