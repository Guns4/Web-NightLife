import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const cronSecret = process.env.CRON_SECRET || '';

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VenueData {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string | null;
  rating: number;
  price_range: number;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string;
  keywords: string[];
  featured_venues: VenueData[];
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

// Get top venues by city/category
async function getTopVenues(): Promise<VenueData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // For now, we'll get top rated venues as a fallback
  // In production, you'd have a venue_views table to track views
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, city, category, description, rating, price_range')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }

  return data || [];
}

// Group venues by city
function groupVenuesByCity(venues: VenueData[]): Record<string, VenueData[]> {
  return venues.reduce((acc, venue) => {
    const city = venue.city || 'Other';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(venue);
    return acc;
  }, {} as Record<string, VenueData[]>);
}

// Generate article using OpenAI
async function generateArticleWithAI(venuesByCity: Record<string, VenueData[]>): Promise<GeneratedArticle> {
  const cityName = Object.keys(venuesByCity)[0] || 'Jakarta';
  const topVenues = venuesByCity[cityName]?.slice(0, 5) || [];

  const venueList = topVenues.map((v, i) => 
    `${i + 1}. ${v.name} - ${v.category} - Rating: ${v.rating}/5`
  ).join('\n');

  const prompt = `Acting as a professional lifestyle journalist for AfterHoursID, write a high-end, SEO-optimized article titled 'The Weekly Vibe: Top Trending Spots in ${cityName}'. 

Use the following data:
${venueList}

Requirements:
- Tone: Elegant, mysterious, and trendy
- Language: Indonesian (Gaul & Modern)
- Include an engaging introduction (2-3 sentences)
- For each venue, write 2-3 sentences describing why it's trending
- Include a conclusion with a call-to-action
- Format the content in HTML with <h2>, <p>, <ul>, <li> tags
- Include meta description (max 160 characters)
- Include 5-8 relevant keywords as an array

Return the response as a JSON object with these fields:
{
  "title": "...",
  "excerpt": "...",
  "content": "HTML content...",
  "meta_description": "...",
  "keywords": ["...", "..."]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional lifestyle journalist.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      // Parse the JSON response
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `The Weekly Vibe: Top Trending Spots in ${cityName}`,
        slug: generateSlug(parsed.title || `The Weekly Vibe: Top Trending Spots in ${cityName}`),
        excerpt: parsed.excerpt || '',
        content: parsed.content || '',
        meta_description: parsed.meta_description || '',
        keywords: parsed.keywords || [],
        featured_venues: topVenues,
      };
    }
  } catch (err) {
    console.error('AI generation error:', err);
  }

  // Fallback: Generate basic article without AI
  return {
    title: `The Weekly Vibe: Top Trending Spots in ${cityName}`,
    slug: generateSlug(`The Weekly Vibe: Top Trending Spots in ${cityName}`),
    excerpt: `Discover the most popular nightlife venues in ${cityName} this week.`,
    content: generateFallbackContent(topVenues, cityName),
    meta_description: `Explore the trending nightlife spots in ${cityName}. Discover the best clubs, bars, and lounges.`,
    keywords: ['nightlife', 'trending', cityName.toLowerCase(), 'clubs', 'bars', 'lounges'],
    featured_venues: topVenues,
  };
}

// Generate fallback content if AI fails
function generateFallbackContent(venues: VenueData[], city: string): string {
  let content = `<h2>Trending Spots in ${city}</h2>\n<p>Welcome to this week's edition of The Weekly Vibe! Here are the top trending venues in ${city}.</p>\n`;

  venues.forEach((venue, index) => {
    content += `
<h3>${index + 1}. ${venue.name}</h3>
<p>${venue.description || `A popular ${venue.category} in ${city} with a rating of ${venue.rating}/5 stars.`}</p>
`;
  });

  content += `
<h2>Conclusion</h2>
<p>These venues represent the best of ${city}'s nightlife scene. Visit them for an unforgettable experience!</p>
`;

  return content;
}

// Send notification to admin
async function sendAdminNotification(articleTitle: string) {
  // In production, integrate with WhatsApp/Email API
  console.log(`📢 Notification: Success: Weekly Article '${articleTitle}' has been published automatically.`);
  
  // Could integrate with WATI API here
  const watiEndpoint = process.env.WATI_API_ENDPOINT;
  const watiToken = process.env.WATI_ACCESS_TOKEN;
  
  if (watiEndpoint && watiToken) {
    try {
      await fetch(`${watiEndpoint}/api/sendTemplateMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': watiToken,
        },
        body: JSON.stringify({
          template_name: 'article_published',
          parameters: {
            article_title: articleTitle,
          },
        }),
      });
    } catch (err) {
      console.error('WhatsApp notification failed:', err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (secret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret' },
        { status: 401 }
      );
    }

    // Get top venues
    const venues = await getTopVenues();
    
    if (venues.length === 0) {
      return NextResponse.json(
        { error: 'No venues available for article generation' },
        { status: 400 }
      );
    }

    // Group by city
    const venuesByCity = groupVenuesByCity(venues);

    // Generate article with AI
    const article = await generateArticleWithAI(venuesByCity);

    // Get next Friday's date
    const now = new Date();
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + (5 + 7 - now.getDay()) % 7);
    nextFriday.setHours(9, 0, 0, 0);

    // Save article to database
    const { data: savedArticle, error: saveError } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: 'Nightlife Guide',
        author: 'AfterHoursID Editorial',
        featured_venues: article.featured_venues,
        meta_description: article.meta_description,
        keywords: article.keywords,
        status: 'published',
        publish_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving article:', saveError);
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      );
    }

    // Send notification
    await sendAdminNotification(article.title);

    return NextResponse.json({
      success: true,
      message: 'Weekly article generated and published successfully',
      article: {
        id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        publish_date: savedArticle.publish_date,
      },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable caching for this route
export const dynamic = 'force-dynamic';
