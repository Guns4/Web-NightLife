import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/services/payments/payment-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // If payment is settled, send WhatsApp notification to merchant
    if (payload.transaction_status === 'settlement') {
      await sendPaymentConfirmationNotification(payload.order_id);
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

/**
 * Send WhatsApp notification to merchant after payment is settled
 */
async function sendPaymentConfirmationNotification(orderId: string) {
  try {
    // Get payment details with venue info using Prisma
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        adSlot: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });
    
    if (!payment || !payment.adSlot?.venue?.ownerId) {
      console.error('Failed to fetch payment details');
      return;
    }
    
    const venue = payment.adSlot.venue;
    const ownerId = venue.ownerId;
    const slotType = payment.adSlot.slotType;
    const amount = payment.amount;
    const startDate = new Date(payment.adSlot.startDate).toLocaleDateString('id-ID');
    const endDate = new Date(payment.adSlot.endDate).toLocaleDateString('id-ID');
    
    // Get owner details
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { fullName: true, phone: true },
    });
    
    if (!owner) return;
    
    // Format WhatsApp message
    const message = `🎉 *Pembayaran Berhasil!*\n\n` +
      `Hai ${owner.fullName || 'Partner'}!\n\n` +
      `Pembayaran untuk iklan *${venue.name}* telah dikonfirmasi.\n\n` +
      `📊 *Detail:*\n` +
      `• Tipe Slot: ${slotType}\n` +
      `• Periode: ${startDate} - ${endDate}\n` +
      `• Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Iklan Anda akan segera aktif! 🚀\n\n` +
      `_AfterHoursID - Platform Hiburan Malam_`;
    
    // Send WhatsApp message via API
    const whatsappNumber = owner.phone?.replace(/^0/, '+62');
    
    if (whatsappNumber) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: whatsappNumber,
            message,
          }),
        });
      } catch (waError) {
        console.error('WhatsApp send error:', waError);
      }
    }
    
    // Create in-app notification (if notification table exists)
    try {
      await prisma.notification?.create({
        data: {
          userId: ownerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Pembayaran Berhasil',
          message: `Pembayaran untuk iklan ${venue.name} telah dikonfirmasi.`,
          data: JSON.stringify({
            paymentId: payment.id,
            adSlotId: payment.adSlot.id,
            venueId: venue.id,
          }),
        },
      }).catch(() => {}); // Ignore if table doesn't exist
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}

// Handle GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment webhook is running',
  });
}
