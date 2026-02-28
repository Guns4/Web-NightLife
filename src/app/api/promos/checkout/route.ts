/**
 * =====================================================
 * PROMO CHECKOUT API
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPromo, TIER_PRICING, PromoTier } from '@/lib/services/promo-service';

interface CheckoutRequest {
  venueId: string;
  title: string;
  description: string;
  imageUrl: string;
  tier: PromoTier;
  startDate: string;
  endDate: string;
}

// POST /api/promos/checkout - Create promo checkout
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { venueId, title, description, imageUrl, tier, startDate, endDate } = body;
    
    // Validate required fields
    if (!venueId || !title || !description || !tier || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate tier
    if (!['basic', 'gold', 'platinum'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }
    
    // Calculate cost
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 1) {
      return NextResponse.json(
        { error: 'Promo must be at least 1 day' },
        { status: 400 }
      );
    }
    
    const tierInfo = TIER_PRICING[tier];
    const totalCost = tierInfo.price * days;
    
    // Create promo in draft status
    const promo = await createPromo({
      venueId,
      title,
      description,
      imageUrl: imageUrl || 'https://res.cloudinary.com/afterhoursid/image/upload/promos/default.jpg',
      tier,
      startDate,
      endDate,
      budget: totalCost,
    });
    
    // In production, would create Midtrans/Xendit payment link here
    const paymentLink = {
      id: `pay_${promo.id}`,
      promoId: promo.id,
      amount: totalCost,
      currency: 'IDR',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      checkoutUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${promo.id}`,
    };
    
    return NextResponse.json({
      success: true,
      promo,
      payment: paymentLink,
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
