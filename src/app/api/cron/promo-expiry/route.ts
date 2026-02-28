/**
 * =====================================================
 * PROMO EXPIRY AUTOMATION CRON
 * AfterHoursID - Automated Promo Engine
 * 
 * Runs daily at 00:00 UTC (07:00 WITA)
 * =====================================================
 */

import { NextResponse } from 'next/server';
import { archiveExpiredPromos } from '@/lib/actions/promo.actions';
// Note: Email service would be imported here when available
    // import { sendEmail } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

// Cron job for daily promo expiry check
export async function GET() {
  const startTime = Date.now();
  let expiredCount = 0;
  let notificationCount = 0;
  
  try {
    console.log('[CRON] Starting daily promo expiry check...');
    
    // 1. Archive expired promos
    expiredCount = await archiveExpiredPromos();
    console.log(`[CRON] Archived ${expiredCount} expired promos`);
    
    // 2. Send expiry notifications (in production)
    // This would query the database for promos expiring tomorrow
    // and send email notifications to venue owners
    
    /*
    const expiringTomorrow = await getPromosExpiringTomorrow();
    for (const promo of expiringTomorrow) {
      await sendEmail({
        to: promo.ownerEmail,
        subject: 'Your promo expires tomorrow!',
        template: 'promo-expiring',
        data: { promo },
      });
      notificationCount++;
    }
    */
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Promo expiry check completed',
      expiredCount,
      notificationCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[CRON] Promo expiry check failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Promo expiry check failed',
        message: String(error),
      },
      { status: 500 }
    );
  }
}
