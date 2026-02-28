/**
 * =====================================================
 * GET VENUE REVIEWS API
 * Public endpoint - filters out shadow-banned users
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVenueReviews } from "@/lib/services/reviews/review-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get user role from database
 */
async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!venueId) {
      return NextResponse.json(
        { error: "venueId is required" },
        { status: 400 }
      );
    }

    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    
    let userRole: string | null = null;
    let isAdmin = false;
    let isOwner = false;

    if (user) {
      userRole = await getUserRole(user.id);
      isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
      isOwner = userRole === "OWNER";
    }

    const result = await getVenueReviews(venueId, {
      limit,
      offset,
      includeUnapproved: isAdmin || isOwner,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching venue reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
