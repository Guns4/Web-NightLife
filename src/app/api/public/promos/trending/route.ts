/**
 * =====================================================
 * API PUBLIC PROMOS TRENDING
 * Fetch trending promos with highest engagement
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { promoService } from "@/lib/services/promo/mongo-promo-service";
import { adsTrackerService } from "@/lib/services/ads/ads-tracker";
import { prisma } from "@/lib/auth/prisma-client";

// GET - Fetch trending promos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Filters
    const city = searchParams.get("city");
    const promoType = searchParams.get("type");
    const venueId = searchParams.get("venueId");

    // Get active promos
    let promos = await promoService.getActivePromos({
      limit: 100, // Get more to sort by engagement
      skip: 0,
    });

    // Filter by type if specified
    if (promoType) {
      promos = promos.filter(p => p.promoType === promoType);
    }

    // Filter by venue if specified
    if (venueId) {
      promos = promos.filter(p => p.venueId === venueId);
    }

    // Enrich promos with engagement metrics from ads tracker
    const enrichedPromos = await Promise.all(
      promos.map(async (promo) => {
        // Get metrics from ads tracker
        const metrics = await adsTrackerService.getAdMetrics(promo._id.toString());
        
        // Get venue info for city filter
        const venue = await prisma.venue.findUnique({
          where: { id: promo.venueId },
          select: { 
            id: true, 
            name: true, 
            city: true, 
            address: true,
            category: true,
          },
        });

        // Filter by city if specified
        if (city && venue?.city?.toLowerCase() !== city.toLowerCase()) {
          return null;
        }

        // Calculate engagement score (views + clicks + claims weighted)
        const engagementScore = 
          (promo.views || 0) * 1 + 
          (promo.claims || 0) * 5 + 
          (promo.conversions || 0) * 10 +
          (metrics?.clicks || 0) * 3 +
          (metrics?.claims || 0) * 5;

        return {
          id: promo._id.toString(),
          venueId: promo.venueId,
          venue: venue ? {
            id: venue.id,
            name: venue.name,
            city: venue.city,
            address: venue.address,
            category: venue.category,
          } : null,
          title: promo.title,
          description: promo.description,
          promoType: promo.promoType,
          promoData: promo.promoData,
          imageUrl: promo.imageUrl,
          startDate: promo.startDate,
          endDate: promo.endDate,
          isFeatured: promo.isFeatured,
          metrics: {
            views: promo.views || 0,
            claims: promo.claims || 0,
            conversions: promo.conversions || 0,
            impressions: metrics?.impressions || 0,
            clicks: metrics?.clicks || 0,
            ctr: metrics?.ctr || 0,
          },
          engagementScore,
        };
      })
    );

    // Filter out nulls and sort by engagement score
    const filteredPromos = enrichedPromos
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(skip, skip + limit);

    // Get total for pagination
    const total = enrichedPromos.length;

    return NextResponse.json({
      success: true,
      promos: filteredPromos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Trending promos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending promos" },
      { status: 500 }
    );
  }
}
