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

// Verification radius in meters
const VERIFICATION_RADIUS_METERS = 100;

/**
 * Haversine Formula - Calculate distance between two GPS coordinates
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Log GPS verification attempt to audit_logs table
 */
async function logAuditEvent(
  userId: string,
  venueId: string,
  userLat: number,
  userLon: number,
  venueLat: number,
  venueLon: number,
  distance: number,
  isVerified: boolean,
  reviewId?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'GPS_VERIFICATION_ATTEMPT',
      entity_type: 'vibe_check',
      entity_id: reviewId || null,
      new_values: {
        venue_id: venueId,
        review_id: reviewId,
        user_coordinates: { lat: userLat, lon: userLon },
        venue_coordinates: { lat: venueLat, lon: venueLon },
        distance_meters: Math.round(distance),
        verification_radius_meters: VERIFICATION_RADIUS_METERS,
        is_verified: isVerified,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      venue_id, 
      rating, 
      comment, 
      user_latitude, 
      user_longitude,
      user_id 
    } = body;

    // Validate required fields
    if (!venue_id || !rating || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: venue_id, rating, user_id' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Fetch venue coordinates
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, latitude, longitude')
      .eq('id', venue_id)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Check if venue has coordinates
    if (!venue.latitude || !venue.longitude) {
      // If venue doesn't have coordinates, allow review but don't verify
      const { data: review, error: insertError } = await supabase
        .from('vibe_checks')
        .insert({
          venue_id,
          user_id,
          rating,
          comment: comment?.trim() || null,
          user_latitude,
          user_longitude,
          is_verified_visit: false
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        review,
        verified: false,
        message: 'Review submitted. Venue location not available for verification.'
      });
    }

    // Perform GPS verification
    let isVerified = false;
    let distance = 0;

    if (user_latitude && user_longitude) {
      distance = calculateDistance(
        user_latitude, 
        user_longitude, 
        venue.latitude, 
        venue.longitude
      );
      isVerified = distance <= VERIFICATION_RADIUS_METERS;
    }

    // Log the verification attempt for security audit
    await logAuditEvent(
      user_id,
      venue_id,
      user_latitude || 0,
      user_longitude || 0,
      venue.latitude,
      venue.longitude,
      distance,
      isVerified
    );

    // Insert the review with verification status
    const { data: review, error: insertError } = await supabase
      .from('vibe_checks')
      .insert({
        venue_id,
        user_id,
        rating,
        comment: comment?.trim() || null,
        user_latitude,
        user_longitude,
        is_verified_visit: isVerified
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review,
      verified: isVerified,
      distance_meters: Math.round(distance),
      message: isVerified 
        ? 'Review submitted and verified! 🎉'
        : 'Review submitted. To get verified, be within 100m of the venue.'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
