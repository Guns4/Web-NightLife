import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron Job: Intro to Normal Pricing Transition
 * 
 * Runs daily to check merchants who have passed their 130-day intro period
 * and log notifications for pricing changes
 * 
 * Schedule: Run daily at 1 AM
 */

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      merchantsChecked: 0,
      introPeriodEnding: 0,
      transitionedToNormal: 0,
      errors: [] as string[]
    };

    // Get all active venues with their owners
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name, owner_id, created_at')
      .eq('is_active', true);

    if (venuesError) {
      results.errors.push(`Error fetching venues: ${venuesError.message}`);
      return NextResponse.json({ error: venuesError.message }, { status: 500 });
    }

    // Check each venue's owner for intro period
    const INTRO_DAYS = 130;
    const THRESHOLD_DAYS = 7; // Notify when 7 days left

    for (const venue of venues || []) {
      results.merchantsChecked++;

      // Get owner signup date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', venue.owner_id)
        .single();

      const signupDate = new Date(profile?.created_at || venue.created_at);
      const daysSinceSignup = Math.floor(
        (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const introDaysRemaining = INTRO_DAYS - daysSinceSignup;

      // Check if intro period is ending soon (7 days)
      if (introDaysRemaining > 0 && introDaysRemaining <= THRESHOLD_DAYS) {
        results.introPeriodEnding++;
        
        // Log notification (in production, send WhatsApp/email)
        console.log(`[PricingCron] Venue "${venue.name}" intro period ends in ${introDaysRemaining} days`);
        
        // Could insert into notifications table here
        // await supabase.from('notifications').insert({...})
      }

      // Check if transitioned today
      if (daysSinceSignup === INTRO_DAYS) {
        results.transitionedToNormal++;
        
        console.log(`[PricingCron] Venue "${venue.name}" transitioned to NORMAL pricing`);
        
        // Log the transition
        await supabase.from('analytics_events').insert({
          event_type: 'pricing_transition',
          venue_id: venue.id,
          metadata: {
            venue_name: venue.name,
            signup_date: profile?.created_at || venue.created_at,
            pricing_type: 'NORMAL',
            intro_days: INTRO_DAYS
          },
          created_at: now.toISOString()
        });
      }
    }

    console.log(`[PricingCron] Completed: ${results.merchantsChecked} merchants checked, ${results.transitionedToNormal} transitioned to normal pricing`);

    return NextResponse.json({
      success: true,
      message: 'Pricing transition check completed',
      timestamp: now.toISOString(),
      results
    });

  } catch (error) {
    console.error('[PricingCron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
