/**
 * =====================================================
 * REVIEW SOCIAL API
 * Like and Report endpoints
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toggleLike, reportReview, REPORT_REASONS, type ReportReason } from "@/lib/services/reviews/review-engine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * POST - Like or Report a review
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, reviewId, reason, description } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }

    // Handle Like
    if (action === "like") {
      const result = await toggleLike(reviewId, user.id);
      return NextResponse.json(result);
    }

    // Handle Report
    if (action === "report") {
      if (!reason || !Object.values(REPORT_REASONS).includes(reason)) {
        return NextResponse.json(
          { error: "Valid report reason is required" },
          { status: 400 }
        );
      }

      const result = await reportReview(
        reviewId, 
        user.id, 
        reason as ReportReason, 
        description
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'like' or 'report'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in social action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if user liked a review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");
    const checkLiked = searchParams.get("checkLiked") === "true";

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }

    // Get current user (optional)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get likes count
    const { count: likesCount } = await supabase
      .from("review_likes")
      .select("*", { count: "exact" })
      .eq("review_id", reviewId);

    const result: { likesCount: number; userLiked?: boolean } = {
      likesCount: likesCount || 0,
    };

    // Check if user has liked (if authenticated)
    if (user && checkLiked) {
      const { data: like } = await supabase
        .from("review_likes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .single();

      result.userLiked = !!like;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting social data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
