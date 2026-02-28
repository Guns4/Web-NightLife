import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Gemini AI Integration
let genAI: any = null;
let model: any = null;

// Initialize Gemini if API key is available
if (process.env.GEMINI_API_KEY) {
  try {
    // Dynamic import to avoid build errors if package not installed
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
  } catch (err) {
    console.log('Gemini not available, using fallback');
  }
}

export async function GET(req: Request) {
  // 1. Security Check (Hanya Vercel Cron atau Admin yang bisa akses)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Ambil Data Tren (Top 5 Venue paling banyak di-klik dalam 7 hari terakhir)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Try to get from venue_views if it exists
    let topVenues: string[] = [];
    let venuesWithTrustScore: { name: string; trust_score: number; has_promo: boolean }[] = [];
    
    try {
      const { data: trendingData, error: dbError } = await supabase
        .from('venue_views')
        .select('venue_id, venues(name, city, category)')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(50);

      if (!dbError && trendingData && trendingData.length > 0) {
        // Aggregate views by venue
        const summary: Record<string, number> = {};
        trendingData.forEach((curr: any) => {
          const name = curr.venues?.name;
          if (name) {
            summary[name] = (summary[name] || 0) + 1;
          }
        });

        topVenues = Object.entries(summary)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name);
      }
    } catch (err) {
      console.log('venue_views table not available, using fallback');
    }

    // 2b. Get venues with high Trust Scores and active promos
    const now = new Date().toISOString();
    try {
      const { data: venuesWithPromos, error: promoError } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          trust_score,
          promos(title, is_active, start_date, end_date)
        `)
        .eq('is_active', true)
        .gt('trust_score', 50)
        .order('trust_score', { ascending: false })
        .limit(10);

      if (!promoError && venuesWithPromos) {
        venuesWithTrustScore = venuesWithPromos
          .filter((v: any) => {
            // Check if venue has active promo
            const hasActivePromo = v.promos?.some(
              (p: any) => p.is_active && p.start_date <= now && p.end_date >= now
            );
            return hasActivePromo;
          })
          .map((v: any) => ({
            name: v.name,
            trust_score: v.trust_score || 0,
            has_promo: true
          }));
      }
    } catch (err) {
      console.log('Could not fetch trust score data');
    }

    // Fallback: Get top rated venues if no views data
    if (topVenues.length === 0) {
      const { data: venues, error: venueError } = await supabase
        .from('venues')
        .select('name, trust_score')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (!venueError && venues) {
        topVenues = venues.map((v: any) => v.name);
      }
    }

    let articleBody: string;
    let articleTitle: string;

    // 3. Generate Article with AI
    const trustedVenuesInfo = venuesWithTrustScore
      .map(v => `${v.name} (Trust Score: ${Math.round(v.trust_score)}%)`)
      .join(", ");
    
    if (model && topVenues.length > 0) {
      const prompt = `
        Bertindaklah sebagai Jurnalis Lifestyle Senior AfterHoursID. 
        Tulis artikel blog yang mewah, misterius, dan trendy dalam Bahasa Indonesia (Gaul & Modern).
        Topik: "The Friday Rundown: Top Trending Spots Minggu Ini".
        Data Tempat Terpopuler: ${topVenues.join(", ")}.
        
        HIGHLIGHT - Venue dengan Trust Score Tinggi & Promo Aktif:
        '${trustedVenuesInfo || "Belum ada data trust score"}'
        
        Prompt Injection: Sorot venue-venue yang memiliki Trust Score tinggi (dari Verified GPS Visits) 
        dan sedang memiliki promo aktif weekend. Ini menunjukkan venue tersebut terpercaya dan sedang memberikan offers menarik!
        
        Struktur: Headline yang menarik, Intro yang Vibe-y, penjelasan singkat per tempat, 
        bagian "Best Picks" untuk venue dengan trust score tinggi + promo, dan Outro.
        Format: Markdown.
      `;

      const result = await model.generateContent(prompt);
      articleBody = result.response.text();
      articleTitle = `The Friday Rundown: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else {
      // Fallback content generation
      articleTitle = `The Friday Rundown: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
      articleBody = `# ${articleTitle}\n\n`;
      articleBody += `Berikut adalah tempat-tempat trending yang wajib dikunjungi minggu ini:\n\n`;
      topVenues.forEach((venue: string, index: number) => {
        articleBody += `## ${index + 1}. ${venue}\n\nTempat ini merupakan salah satu venue paling populer minggu ini dengan suasana yang amazing!\n\n`;
      });
      articleBody += `Jangan lewatkan pengalaman nightlife terbaik minggu ini. Sampai jumpa!`;
    }

    // 4. Simpan ke Tabel Articles
    const slug = `friday-rundown-${Date.now()}`;
    const { error: insertError } = await supabase
      .from('articles')
      .insert({
        title: articleTitle,
        content: articleBody,
        slug: slug,
        status: 'published',
        author: 'AfterHours AI',
        category: 'Nightlife Guide',
        meta_description: `Discover trending nightlife spots this week: ${topVenues.slice(0, 3).join(", ")}`,
        keywords: ['nightlife', 'trending', 'afterhours', 'Jakarta', 'Bali'],
        publish_date: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // 5. Send Notification
    console.log(`📢 Notification: Success: Weekly Article '${articleTitle}' has been published automatically.`);
    
    // Send WhatsApp notification if configured
    if (process.env.WATI_API_ENDPOINT && process.env.WATI_ACCESS_TOKEN) {
      try {
        await fetch(`${process.env.WATI_API_ENDPOINT}/api/sendTemplateMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.WATI_ACCESS_TOKEN,
          },
          body: JSON.stringify({
            template_name: 'article_published',
            parameters: { article_title: articleTitle },
          }),
        });
      } catch (notifyErr) {
        console.error('WhatsApp notification failed:', notifyErr);
      }
    }

    return NextResponse.json({ success: true, message: "Article published!", slug });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
