import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron Job: Promo Scheduler
 * 
 * Runs every midnight to:
 * 1. Auto-activate promos that have reached their start_date
 * 2. Auto-deactivate promos that have passed their end_date
 * 3. Deactivate expired boosts
 * 
 * Schedule: Run at midnight daily
 */

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // In production, verify against CRON_SECRET env var
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const results = {
      activated: 0,
      deactivated: 0,
      boostDeactivated: 0,
      errors: [] as string[]
    };

    // 1. Auto-activate promos that have reached their start_date
    const { data: promosToActivate, error: activateError } = await supabase
      .from('promos')
      .update({ is_active: true, updated_at: now })
      .eq('is_active', false)
      .lte('start_date', now)
      .gte('end_date', now)
      .select('id, title');

    if (activateError) {
      results.errors.push(`Activation error: ${activateError.message}`);
    } else {
      results.activated = promosToActivate?.length || 0;
      console.log(`[PromoScheduler] Activated ${results.activated} promos`);
    }

    // 2. Auto-deactivate promos that have passed their end_date
    const { data: promosToDeactivate, error: deactivateError } = await supabase
      .from('promos')
      .update({ is_active: false, updated_at: now })
      .eq('is_active', true)
      .lt('end_date', now)
      .select('id, title');

    if (deactivateError) {
      results.errors.push(`Deactivation error: ${deactivateError.message}`);
    } else {
      results.deactivated = promosToDeactivate?.length || 0;
      console.log(`[PromoScheduler] Deactivated ${results.deactivated} promos`);
    }

    // 3. Deactivate expired boosts
    const { data: expiredBoosts, error: boostError } = await supabase
      .from('venues')
      .update({ 
        is_boosted: false, 
        boost_slot: null,
        boost_expiry: null,
        updated_at: now 
      })
      .eq('is_boosted', true)
      .lt('boost_expiry', now)
      .select('id, name');

    if (boostError) {
      results.errors.push(`Boost deactivation error: ${boostError.message}`);
    } else {
      results.boostDeactivated = expiredBoosts?.length || 0;
      console.log(`[PromoScheduler] Deactivated ${results.boostDeactivated} boosts`);
    }

    // 4. Update ads_orders status for expired ads
    const { error: ordersError } = await supabase
      .from('ads_orders')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('ends_at', now);

    if (ordersError) {
      results.errors.push(`Orders update error: ${ordersError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Promo scheduler completed',
      timestamp: now,
      results
    });

  } catch (error) {
    console.error('[PromoScheduler] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
