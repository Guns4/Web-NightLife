/**
 * =====================================================
 * VENUE SENTIMENT API
 * Returns sentiment analysis data for owner dashboard
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { getVenueSentiment } from "@/lib/services/reviews/review-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;

    if (!venueId) {
      return NextResponse.json(
        { error: "venueId is required" },
        { status: 400 }
      );
    }

    const sentimentData = await getVenueSentiment(venueId);

    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error("Error fetching sentiment data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sentiment data" },
      { status: 500 }
    );
  }
}
