import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface WeeklyReportData {
  period_start: string;
  period_end: string;
  new_users: number;
  new_promo_claims: number;
  new_merchant_promos: number;
  ad_revenue: number;
  top_venue: {
    name: string;
    views: number;
  } | null;
  trust_score: number;
  total_reviews: number;
  verified_reviews: number;
  estimated_revenue: number;
}

/**
 * Fetch weekly business intelligence data
 */
export async function fetchWeeklyReportData(): Promise<WeeklyReportData> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const periodStart = weekAgo.toISOString().split('T')[0];
  const periodEnd = now.toISOString().split('T')[0];

  // 1. Count new users in last 7 days
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // 2. Count new promo claims in last 7 days
  const { count: newPromoClaims } = await supabase
    .from('promo_claims')
    .select('*', { count: 'exact', head: true })
    .gte('claimed_at', weekAgo.toISOString());

  // 3. Get venue with highest views
  const { data: venueViews } = await supabase
    .from('venues')
    .select('name, venue_views')
    .order('venue_views', { ascending: false })
    .limit(1)
    .single();

  // 4. Calculate Trust Score
  const { count: totalReviews } = await supabase
    .from('vibe_checks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  const { count: verifiedReviews } = await supabase
    .from('vibe_checks')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified_visit', true)
    .gte('created_at', weekAgo.toISOString());

  const trustScore = (totalReviews ?? 0) > 0 
    ? Math.round(((verifiedReviews ?? 0) / (totalReviews ?? 0)) * 100)
    : 0;

  // 5. Calculate estimated revenue (from bookings and listing fees)
  const { data: revenueData } = await supabase
    .from('bookings')
    .select('total_amount')
    .gte('created_at', weekAgo.toISOString())
    .eq('status', 'confirmed');

  const bookingRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

  // Get listing fees
  const { data: listingData } = await supabase
    .from('venue_subscriptions')
    .select('amount')
    .gte('created_at', weekAgo.toISOString())
    .eq('status', 'active');

  const listingRevenue = listingData?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

  // 6. Get Merchant Portal data (new promos uploaded by merchants)
  let newMerchantPromos = 0;
  let adRevenue = 0;
  
  try {
    const { count: promoCount } = await supabase
      .from('promos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());
    newMerchantPromos = promoCount ?? 0;
    
    // Get ad revenue from ads_orders
    const { data: adsData } = await supabase
      .from('ads_orders')
      .select('price_amount')
      .gte('purchased_at', weekAgo.toISOString())
      .eq('status', 'active');
    
    adRevenue = adsData?.reduce((sum, a) => sum + (a.price_amount || 0), 0) || 0;
  } catch (err) {
    // Tables might not exist yet
    console.log('Merchant portal tables not available');
  }

  return {
    period_start: periodStart,
    period_end: periodEnd,
    new_users: newUsers ?? 0,
    new_promo_claims: newPromoClaims ?? 0,
    new_merchant_promos: newMerchantPromos,
    ad_revenue: adRevenue,
    top_venue: venueViews ? {
      name: venueViews.name,
      views: venueViews.venue_views || 0
    } : null,
    trust_score: trustScore,
    total_reviews: totalReviews ?? 0,
    verified_reviews: verifiedReviews ?? 0,
    estimated_revenue: bookingRevenue + listingRevenue
  };
}

/**
 * Format the weekly report as WhatsApp message
 */
export function formatWeeklyReportMessage(data: WeeklyReportData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return `📊 *EXECUTIVE PULSE - Weekly Report*

🗓️ *${data.period_start} to ${data.period_end}*

👥 *User Growth*
• New Users: +${data.new_users.toLocaleString()}

🎟️ *Promo Performance*
• Claims: +${data.new_promo_claims.toLocaleString()}

🏪 *Merchant Portal*
• New Promos Uploaded: +${data.new_merchant_promos.toLocaleString()}
• Ad Revenue: ${formatCurrency(data.ad_revenue)}

 *Top Venue*
${data.top_venue ? `• ${data.top_venue.name} (${data.top_venue.views.toLocaleString()} views)` : '• N/A'}

⭐ *Review Integrity*
• Trust Score: ${data.trust_score}%
• Total Reviews: ${data.total_reviews}
• Verified: ${data.verified_reviews}

💰 *Revenue*
• Estimated: ${formatCurrency(data.estimated_revenue)}

━━━━━━━━━━━━━━━━━━━━━
🔗 *Admin Dashboard:* https://nightlife.id/dashboard/super-admin/transparency

Sent via AfterHours ID 🚀`;
}

/**
 * Format error alert message for WhatsApp
 */
export function formatErrorAlertMessage(error: string): string {
  return `⚠️ *SYSTEM ALERT*

🚨 *Weekly Report Generation Failed*

Error: ${error}

Please check the system logs for details.

- AfterHours ID System`;
}
