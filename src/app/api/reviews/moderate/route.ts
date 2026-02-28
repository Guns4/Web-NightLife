/**
 * =====================================================
 * REVIEW MODERATION API
 * Admin endpoint - approve/reject reviews, manage shadow bans
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  getPendingReviews, 
  moderateReview, 
  shadowBanUser,
  type RejectionReasonCode 
} from "@/lib/services/reviews/review-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verify user is admin
 */
async function requireAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === "SUPER_ADMIN" || data?.role === "ADMIN";
}

/**
 * GET - Get pending reviews for moderation
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getPendingReviews({ limit, offset });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST - Moderate a review (approve/reject) or toggle shadow ban
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reviewId, reasonCode, reason, userId, shadowBan } = body;

    // Handle review moderation
    if (action === "approve" || action === "reject") {
      if (!reviewId) {
        return NextResponse.json(
          { error: "reviewId is required" },
          { status: 400 }
        );
      }

      if (action === "reject" && (!reasonCode || !reason)) {
        return NextResponse.json(
          { error: "reasonCode and reason are required for rejection" },
          { status: 400 }
        );
      }

      const result = await moderateReview(
        reviewId, 
        action, 
        reasonCode as RejectionReasonCode | undefined, 
        reason,
        user.id
      );

      return NextResponse.json({
        success: true,
        action,
        review: result,
      });
    }

    // Handle shadow ban
    if (action === "shadowBan" || action === "removeShadowBan") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }

      const banned = action === "shadowBan";
      const result = await shadowBanUser(userId, banned);

      return NextResponse.json({
        success: true,
        action: banned ? "shadowBan" : "removeShadowBan",
        user: result,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error moderating review:", error);
    return NextResponse.json(
      { error: "Failed to moderate review" },
      { status: 500 }
    );
  }
}
