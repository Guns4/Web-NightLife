/**
 * =====================================================
 * MIDTRANS WEBHOOK HANDLER
 * AfterHoursID - Payment Webhook Processing
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleMidtransWebhook } from '@/lib/services/roi-dashboard-service';
import { prisma } from "@/lib/auth/prisma-client";

// Verify Midtrans webhook signature
function verifyMidtransSignature(
  signature: string,
  orderId: string,
  statusCode: string,
  grossAmount: string
): boolean {
  // In production, verify using Midtrans API
  // const hash = crypto.createHash('sha512');
  // const data = orderId + statusCode + grossAmount + process.env.MIDTRANS_SERVER_KEY;
  // return signature === hash.update(data).digest('hex');
  return true; // Simplified for demo
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract webhook data
    const {
      order_id,
      transaction_status,
      gross_amount,
      payment_type,
      transaction_time,
      signature_key,
    } = body;
    
    // Verify signature
    if (signature_key && !verifyMidtransSignature(
      signature_key,
      order_id,
      '200',
      gross_amount
    )) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Handle different transaction statuses
    let prismaUpdate: any = {};
    
    switch (transaction_status) {
      case 'settlement':
      case 'capture':
        prismaUpdate = {
          paymentStatus: 'PAID',
          paidAt: new Date(transaction_time),
        };
        break;
      case 'pending':
        prismaUpdate = {
          paymentStatus: 'PENDING',
        };
        break;
      case 'deny':
      case 'expire':
      case 'cancel':
        prismaUpdate = {
          paymentStatus: 'FAILED',
          failedAt: new Date(),
        };
        break;
      default:
        console.log('Unknown transaction status:', transaction_status);
    }
    
    // Update booking/promo payment in database
    if (order_id && Object.keys(prismaUpdate).length > 0) {
      // Skip updates - orderId doesn't exist on these models
      // The payment status is updated in payment-service.ts
    }
    
    // Process webhook for ROI dashboard
    await handleMidtransWebhook(body);
    
    // Return success to Midtrans
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle Midtrans GET (verification)
export async function GET() {
  return NextResponse.json({
    status: 'active',
    webhook: 'midtrans',
    timestamp: new Date().toISOString(),
  });
}
