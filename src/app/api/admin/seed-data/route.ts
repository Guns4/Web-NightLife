import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Ambil semua ID Venue yang ada di database
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name');

    if (venueError || !venues || venues.length === 0) {
      return NextResponse.json({ error: "No venues found to seed data." }, { status: 404 });
    }

    const dummyLogs = [];
    const now = new Date();

    // 2. Generate 100 - 300 klik acak dalam rentang 7 hari terakhir
    for (let i = 0; i < 250; i++) {
      // Pilih venue secara acak (kita buat beberapa venue lebih dominan agar ada 'pemenang' di artikel)
      const randomVenue = venues[Math.floor(Math.pow(Math.random(), 2) * venues.length)];
      
      // Buat waktu acak dalam 7 hari terakhir
      const randomDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      dummyLogs.push({
        venue_id: randomVenue.id,
        created_at: randomDate.toISOString(),
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', // Simulasi mobile user
        ip_address: `182.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`
      });
    }

    // 3. Insert ke tabel venue_views
    const { error: insertError } = await supabase
      .from('venue_views')
      .insert(dummyLogs);

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully injected 250 dummy views for ${venues.length} venues.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
