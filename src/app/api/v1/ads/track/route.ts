/**
 * =====================================================
 * API ADS TRACK
 * Track ad impressions and clicks
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { adsTrackerService, type AdEventType, type AdTier } from "@/lib/services/ads/ads-tracker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, adId, venueId, adTier, city, userId, sessionId, deviceType, userAgent, latitude, longitude } = body as {
      eventType: AdEventType;
      adId: string;
      venueId: string;
      adTier: AdTier;
      city?: string;
      userId?: string;
      sessionId?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
      userAgent?: string;
      latitude?: number;
      longitude?: number;
    };

    // Validate required fields
    if (!eventType || !adId || !venueId || !adTier) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, adId, venueId, adTier" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes: AdEventType[] = ['impression', 'click', 'claim'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate ad tier
    const validTiers: AdTier[] = ['homepage_banner', 'top_search', 'featured_card'];
    if (!validTiers.includes(adTier)) {
      return NextResponse.json(
        { error: `Invalid adTier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }

    // Track the event based on type
    switch (eventType) {
      case 'impression':
        await adsTrackerService.trackImpression(adId, venueId, adTier, {
          city,
          userId,
          sessionId,
          deviceType,
          userAgent,
          latitude,
          longitude,
        });
        break;
      case 'click':
        await adsTrackerService.trackClick(adId, venueId, adTier, {
          city,
          userId,
          sessionId,
          deviceType,
          userAgent,
          latitude,
          longitude,
        });
        break;
      case 'claim':
        if (!userId) {
          return NextResponse.json(
            { error: "userId is required for claim events" },
            { status: 400 }
          );
        }
        await adsTrackerService.trackClaim(adId, venueId, adTier, userId, {
          city,
          sessionId,
          deviceType,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      eventType,
      adId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Ads tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// GET - Retrieve metrics for an ad
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adId = searchParams.get("adId");
    const venueId = searchParams.get("venueId");
    const action = searchParams.get("action") || "metrics";

    if (action === "trending") {
      const limit = parseInt(searchParams.get("limit") || "10");
      const adTier = searchParams.get("adTier") as AdTier | null;
      const trending = await adsTrackerService.getTrendingAds({ limit, adTier: adTier || undefined });
      return NextResponse.json({ trending });
    }

    if (adId) {
      const metrics = await adsTrackerService.getAdMetrics(adId);
      if (!metrics) {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }
      return NextResponse.json({ metrics });
    }

    if (venueId) {
      const metrics = await adsTrackerService.getVenueMetrics(venueId);
      return NextResponse.json({ metrics });
    }

    return NextResponse.json(
      { error: "Either adId or venueId is required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Ads metrics error:", error);
    return NextResponse.json(
      { error: "Failed to get metrics" },
      { status: 500 }
    );
  }
}
