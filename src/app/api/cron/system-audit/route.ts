import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cleanupAbandonedReservations } from '@/lib/services/reservations/reservation-service';

const prisma = new PrismaClient();

interface AuditResults {
  timestamp: string;
  checks: Record<string, number>;
  cleanups: Record<string, unknown>;
  stats?: Record<string, number>;
  duration?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results: AuditResults = {
      timestamp: new Date().toISOString(),
      checks: {},
      cleanups: {},
    };

    // 1. Check Ad Slots without valid payment
    const adsWithoutPayment = await prisma.adSlot.findMany({
      where: {
        isPaid: false,
        endDate: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });
    results.checks.adsWithoutPayment = adsWithoutPayment.length;

    // 2. Check Reservations without valid userId for registered users
    const invalidReservations = await prisma.booking.count({
      where: {
        userId: null,
        OR: [
          { guestPhone: { equals: undefined } },
          { guestPhone: { equals: '' } },
          { guestEmail: { equals: undefined } },
          { guestEmail: { equals: '' } },
        ],
      },
    });
    results.checks.invalidReservations = invalidReservations;

    // 3. Check orphaned payments (no ad slot)
    const orphanedPayments = await prisma.payment.count({
      where: {
        adSlotId: { equals: undefined },
      },
    });
    results.checks.orphanedPayments = orphanedPayments;

    // 4. Clean up abandoned reservations (older than 24 hours)
    const cleanupResult = await cleanupAbandonedReservations();
    results.cleanups.abandonedReservations = cleanupResult;

    // 5. Check ads with pending payments older than 24 hours
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    const stalePendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: cutoffTime,
        },
      },
    });
    results.checks.stalePendingPayments = stalePendingPayments.length;

    // Auto-cancel stale pending payments
    if (stalePendingPayments.length > 0) {
      await prisma.payment.updateMany({
        where: {
          id: {
            in: stalePendingPayments.map((p: { id: string }) => p.id),
          },
        },
        data: {
          status: 'FAILED',
        },
      });
      results.cleanups.expiredPayments = stalePendingPayments.length;
    }

    // 6. Clean up expired ad slots
    const expiredAdSlots = await prisma.adSlot.findMany({
      where: {
        endDate: {
          lt: new Date(),
        },
        isActive: true,
      },
    });

    if (expiredAdSlots.length > 0) {
      await prisma.adSlot.updateMany({
        where: {
          id: {
            in: expiredAdSlots.map((s: { id: string }) => s.id),
          },
        },
        data: {
          isActive: false,
        },
      });
      results.cleanups.expiredAdSlots = expiredAdSlots.length;
    }

    // 7. Verify data integrity
    // Check for venues with missing required fields
    const venuesWithMissingData = await prisma.venue.count({
      where: {
        OR: [
          { name: { equals: '' } },
          { city: { equals: '' } },
        ],
      },
    });
    results.checks.venuesWithMissingData = venuesWithMissingData;

    // 8. Get summary stats
    const stats = {
      totalVenues: await prisma.venue.count(),
      totalUsers: await prisma.user.count(),
      totalBookings: await prisma.booking.count(),
      totalPayments: await prisma.payment.count(),
      totalAdSlots: await prisma.adSlot.count(),
      activeAds: await prisma.adSlot.count({ where: { isActive: true } }),
    };
    results.stats = stats;

    // Log audit event
    const duration = Date.now() - startTime;
    results.duration = duration;

    console.log('System audit completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('System audit error:', error);
    
    return NextResponse.json(
      { error: 'System audit failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    lastAudit: new Date().toISOString(),
  });
}
