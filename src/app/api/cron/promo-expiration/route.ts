/**
 * =====================================================
 * CRON: PROMO EXPIRATION & NOTIFICATIONS
 * Runs every hour to:
 * 1. Auto-expire promos where endDate < NOW()
 * 2. Send WhatsApp notifications 24h before expiration
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { promoService } from "@/lib/services/promo/mongo-promo-service";
import { prisma } from "@/lib/auth/prisma-client";

// WhatsApp notification function (mock - integrate with actual WhatsApp API)
async function sendWhatsAppNotification(phone: string, message: string) {
  console.log(`[WhatsApp] Sending to ${phone}: ${message}`);
  
  // In production, integrate with:
  // - Meta WhatsApp Business API
  // - Twilio WhatsApp
  // - or other WhatsApp provider
  
  return { success: true, messageId: `msg_${Date.now()}` };
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting promo expiration check...");
    
    const results = {
      expired: [] as string[],
      notificationsSent: [] as string[],
      errors: [] as string[],
    };

    // 1. Find and expire promos that have ended
    const expiredPromos = await prisma.$queryRaw<any[]>`
      SELECT p._id as id, p.title, p."endDate", v.id as venue_id, v.name as venue_name
      FROM "Promo" p
      JOIN "Venue" v ON p."venueId" = v.id
      WHERE p."isActive" = true 
        AND p."endDate" < NOW()
    `;

    for (const promo of expiredPromos) {
      try {
        // Soft delete - set isActive to false
        // Using MongoDB for promos
        await promoService.updatePromo(promo.id, { isActive: false });
        results.expired.push(promo.title);
        console.log(`[Cron] Expired promo: ${promo.title}`);
      } catch (error: any) {
        results.errors.push(`Failed to expire ${promo.title}: ${error.message}`);
      }
    }

    // 2. Find promos expiring in exactly 24 hours for notification
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(Date.now() + 25 * 60 * 60 * 1000);

    // Query promos expiring in 24 hours
    const expiringPromos = await prisma.$queryRaw<any[]>`
      SELECT p._id as id, p.title, p."endDate", v.id as venue_id, v.name as venue_name, u.phone, u."fullName"
      FROM "Promo" p
      JOIN "Venue" v ON p."venueId" = v.id
      JOIN "User" u ON v."ownerId" = u.id
      WHERE p."isActive" = true 
        AND p."endDate" > ${tomorrow}
        AND p."endDate" <= ${in25Hours}
    `;

    for (const promo of expiringPromos) {
      try {
        if (promo.phone) {
          const message = `🔔 Reminder: Your promo "${promo.title}" at ${promo.venue_name} expires in 24 hours! Renew now to keep your visibility. - AfterHoursID`;
          
          await sendWhatsAppNotification(promo.phone, message);
          results.notificationsSent.push(promo.title);
          console.log(`[Cron] Sent notification for: ${promo.title}`);
        }
      } catch (error: any) {
        results.errors.push(`Failed to notify ${promo.title}: ${error.message}`);
      }
    }

    // 3. Also check MongoDB promos using the service
    // For simplicity, we'll skip this and rely on PostgreSQL
    // In production, you'd add getDb export to mongo-promo-service
    const mongoExpiringPromos: any[] = [];

    for (const promo of mongoExpiringPromos) {
      try {
        // Get venue owner from PostgreSQL
        const venue = await prisma.venue.findUnique({
          where: { id: promo.venueId },
          select: { ownerId: true, name: true },
        });

        if (venue?.ownerId) {
          const user = await prisma.user.findUnique({
            where: { id: venue.ownerId },
            select: { phone: true, fullName: true },
          });

          if (user?.phone) {
            const message = `🔔 Reminder: Your promo "${promo.title}" at ${venue.name} expires in 24 hours! Renew now to keep your visibility. - AfterHoursID`;
            
            await sendWhatsAppNotification(user.phone, message);
            results.notificationsSent.push(promo.title);
          }
        }
      } catch (error: any) {
        results.errors.push(`MongoDB notification error: ${error.message}`);
      }
    }

    console.log("[Cron] Promo expiration check complete", results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("[Cron] Promo expiration error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error.message },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
