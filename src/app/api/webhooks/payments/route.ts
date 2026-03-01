import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/services/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Midtrans
    const signatureKey = request.headers.get('x-midtrans-signature-key');
    
    // Parse the webhook payload
    const payload = await request.json();
    
    // Process the webhook
    const result = await processWebhook({
      ...payload,
      signature_key: signatureKey || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    // If payment is settled, log the confirmation
    if (payload.transaction_status === 'settlement') {
      console.log(`Payment settled for order: ${payload.order_id}`);
      // Additional notification logic can be added here
    }
    
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Payment webhook error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment webhook is running',
  });
}
