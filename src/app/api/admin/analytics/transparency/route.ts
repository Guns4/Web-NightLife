import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * GET /api/admin/analytics/transparency
 * Returns review transparency analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Check user authentication and role
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. SUPER_ADMIN only.' }, { status: 403 });
    }

    // Get total reviews count
    const { count: totalReviews, error: totalError } = await supabase
      .from('vibe_checks')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return NextResponse.json({ error: totalError.message }, { status: 500 });
    }

    // Get verified reviews count
    const { count: verifiedReviews, error: verifiedError } = await supabase
      .from('vibe_checks')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified_visit', true);

    if (verifiedError) {
      return NextResponse.json({ error: verifiedError.message }, { status: 500 });
    }

    // Calculate trust score (percentage of verified reviews)
    const trustScore = (totalReviews ?? 0) > 0 
      ? Math.round(((verifiedReviews ?? 0) / (totalReviews ?? 0)) * 100) 
      : 0;

    // Get monthly breakdown for trend
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('vibe_checks')
      .select('id, is_verified_visit, created_at')
      .order('created_at', { ascending: true });

    if (monthlyError) {
      return NextResponse.json({ error: monthlyError.message }, { status: 500 });
    }

    // Group by month
    const monthlyGroups: Record<string, { total: number; verified: number }> = {};
    
    monthlyData.forEach((review: any) => {
      const month = new Date(review.created_at).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = { total: 0, verified: 0 };
      }
      monthlyGroups[month].total += 1;
      if (review.is_verified_visit) {
        monthlyGroups[month].verified += 1;
      }
    });

    // Convert to array format for trend chart
    const trend = Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      total: data.total,
      verified: data.verified,
      percentage: data.total > 0 ? Math.round((data.verified / data.total) * 100) : 0
    }));

    // Get recent unverified reviews (last 10)
    const { data: recentUnverified, error: unverifiedError } = await supabase
      .from('vibe_checks')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_latitude,
        user_longitude,
        user:profiles(full_name, avatar_url),
        venue:venues(name, latitude, longitude)
      `)
      .eq('is_verified_visit', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (unverifiedError) {
      return NextResponse.json({ error: unverifiedError.message }, { status: 500 });
    }

    // Process recent unverified reviews to include distance if GPS was captured
    const processedUnverified = (recentUnverified || []).map((review: any) => {
      let distance = null;
      if (review.user_latitude && review.user_longitude && review.venue?.latitude && review.venue?.longitude) {
        // Calculate approximate distance using Haversine
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (review.venue.latitude * Math.PI) / 180;
        const φ2 = (review.user_latitude * Math.PI) / 180;
        const Δφ = ((review.user_latitude - review.venue.latitude) * Math.PI) / 180;
        const Δλ = ((review.user_longitude - review.venue.longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = Math.round(R * c);
      }

      return {
        id: review.id,
        user: review.user?.full_name || 'Anonymous',
        venue: review.venue?.name || 'Unknown',
        rating: review.rating,
        comment: review.comment,
        distance,
        created_at: review.created_at,
        has_gps: !!(review.user_latitude && review.user_longitude)
      };
    });

    return NextResponse.json({
      summary: {
        total_reviews: totalReviews ?? 0,
        verified_reviews: verifiedReviews ?? 0,
        unverified_reviews: (totalReviews ?? 0) - (verifiedReviews ?? 0),
        trust_score: trustScore
      },
      trend,
      recent_unverified: processedUnverified
    });

  } catch (error) {
    console.error('Error in transparency analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
