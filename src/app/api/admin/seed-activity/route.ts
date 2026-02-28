import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Luxury venues that should get more views (bias)
const LUXURY_VENUES = [
  'Club',
  'Lounge', 
  'Rooftop',
  'Beach Club'
];

export async function GET(req: Request) {
  try {
    // 1. Ambil semua ID Venue yang ada di database
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name, category, city');

    if (venueError || !venues || venues.length === 0) {
      return NextResponse.json({ 
        error: "No venues found. Please create venues first." 
      }, { status: 404 });
    }

    // Filter untuk dapat luxury venues (yang akan di-bias)
    const luxuryVenueIds = venues
      .filter((v: any) => LUXURY_VENUES.includes(v.category))
      .map((v: any) => v.id);

    const regularVenueIds = venues
      .filter((v: any) => !LUXURY_VENUES.includes(v.category))
      .map((v: any) => v.id);

    const dummyLogs = [];
    const now = new Date();

    // 2. Generate 200+ entries dengan bias ke luxury venues
    // 40% of views go to luxury venues (80 entries)
    // 60% go to regular venues (120 entries)
    
    // Generate views for luxury venues (80 entries - higher weight)
    for (let i = 0; i < 80; i++) {
      const randomVenueId = luxuryVenueIds[Math.floor(Math.random() * luxuryVenueIds.length)];
      const randomDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      // Add some hour distribution (more views on weekends Fri-Sat)
      const dayOfWeek = randomDate.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
        // Add extra view for weekend
        dummyLogs.push({
          venue_id: randomVenueId,
          created_at: randomDate.toISOString(),
          user_agent: getRandomUserAgent(),
          ip_address: getRandomIP()
        });
      }
      
      dummyLogs.push({
        venue_id: randomVenueId,
        created_at: randomDate.toISOString(),
        user_agent: getRandomUserAgent(),
        ip_address: getRandomIP()
      });
    }

    // Generate views for regular venues (120 entries)
    for (let i = 0; i < 120; i++) {
      const randomVenueId = regularVenueIds[Math.floor(Math.random() * regularVenueIds.length)];
      const randomDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      dummyLogs.push({
        venue_id: randomVenueId,
        created_at: randomDate.toISOString(),
        user_agent: getRandomUserAgent(),
        ip_address: getRandomIP()
      });
    }

    // 3. Insert ke tabel venue_views
    const { error: insertError } = await supabase
      .from('venue_views')
      .insert(dummyLogs);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // 4. Get summary
    const { data: summary } = await supabase
      .from('venue_views')
      .select('venue_id, venues(name, category)')
      .limit(100);

    // Count by venue
    const venueCounts: Record<string, { name: string; count: number }> = {};
    summary?.forEach((v: any) => {
      const name = v.venues?.name || 'Unknown';
      if (!venueCounts[name]) {
        venueCounts[name] = { name, count: 0 };
      }
      venueCounts[name].count++;
    });

    const topVenues = Object.entries(venueCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, count: data.count }));

    return NextResponse.json({ 
      success: true, 
      message: `Successfully injected ${dummyLogs.length} dummy views`,
      summary: {
        totalViews: dummyLogs.length,
        luxuryVenueViews: 80,
        regularVenueViews: 120,
        topTrendingVenues: topVenues
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 iPad Safari/604.1',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomIP(): string {
  // Indonesian IP ranges (simulated)
  return `182.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export const dynamic = 'force-dynamic';
