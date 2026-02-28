/**
 * =====================================================
 * VIP ACCESS CHECK API
 * AfterHoursID - Partner Scanner Endpoint
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyQRCode, checkVipAccess } from '@/lib/services/membership/membership-service';

// POST /api/v1/partners/vip-access
// Body: { qr_data, venue_id, scanned_by }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_data, venue_id, scanned_by, action } = body;
    
    // Verify API key (partner authentication)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      );
    }
    
    // Action: verify QR code
    if (action === 'verify') {
      if (!qr_data || !venue_id) {
        return NextResponse.json(
          { success: false, error: 'qr_data and venue_id required' },
          { status: 400 }
        );
      }
      
      const result = await verifyQRCode(qr_data, venue_id);
      
      if (!result.valid) {
        return NextResponse.json({
          success: true,
          access: {
            granted: false,
            reason: 'Invalid QR code',
          },
        });
      }
      
      if (result.access?.granted) {
        return NextResponse.json({
          success: true,
          member: {
            id: result.membership?.id,
            tier: result.membership?.tier,
            benefits: result.access.benefit,
          },
          access: {
            granted: true,
            benefit: result.access.benefit,
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        member: {
          id: result.membership?.id,
          tier: result.membership?.tier,
        },
        access: {
          granted: false,
          reason: result.access?.reason || 'Access denied',
        },
      });
    }
    
    // Action: check vip status directly
    if (action === 'status') {
      const userId = body.user_id;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'user_id required' },
          { status: 400 }
        );
      }
      
      const vipStatus = await checkVipAccess(userId);
      
      return NextResponse.json({
        success: true,
        has_access: vipStatus.hasAccess,
        tier: vipStatus.tier,
        benefits: vipStatus.benefits,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: verify, status' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[VIP Access] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
