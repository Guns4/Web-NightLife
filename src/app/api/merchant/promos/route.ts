/**
 * =====================================================
 * API MERCHANT PROMOS
 * CRUD operations for venue promos
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { promoService, type PromoDocument, type PromoType, type FlexiblePromoData } from "@/lib/services/promo/mongo-promo-service";
import { verifyAccessToken } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/prisma-client";

// POST - Create new promo
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("access_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    
    if (token) {
      const payload = verifyAccessToken(token);
      userId = payload?.userId || null;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user from database with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || !['OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Owner or Venue Manager role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      venueId, 
      title, 
      description, 
      promoType, 
      promoData, 
      startDate, 
      endDate,
      imageUrl,
      isFeatured 
    } = body as {
      venueId: string;
      title: string;
      description?: string;
      promoType: PromoType;
      promoData: FlexiblePromoData;
      startDate: string;
      endDate: string;
      imageUrl?: string;
      isFeatured?: boolean;
    };

    // Validate required fields
    if (!venueId || !title || !promoType || !promoData || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify venue ownership
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });

    if (!venue || venue.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't own this venue" },
        { status: 403 }
      );
    }

    // Create promo
    const newPromo = await promoService.createPromo({
      venueId,
      title,
      description,
      promoType,
      promoData,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
      isFeatured: isFeatured || false,
      imageUrl,
      createdBy: userId,
    });

    return NextResponse.json({
      success: true,
      promo: {
        id: newPromo._id.toString(),
        ...newPromo,
      },
    });
  } catch (error: any) {
    console.error("Create promo error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create promo" },
      { status: 500 }
    );
  }
}

// GET - Get promos for authenticated merchant's venues
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("access_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    
    if (token) {
      const payload = verifyAccessToken(token);
      userId = payload?.userId || null;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's venues
    const venues = await prisma.venue.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }) as { id: string }[];

    const venueIds: string[] = venues.map((v: { id: string }) => v.id);

    if (venueIds.length === 0) {
      return NextResponse.json({ promos: [] });
    }

    // Get all promos for user's venues
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    
    // For each venue, get promos
    const allPromos: PromoDocument[] = [];
    for (const venueId of venueIds) {
      const promos = await promoService.getVenuePromos(venueId, { activeOnly });
      allPromos.push(...promos);
    }

    return NextResponse.json({
      promos: allPromos.map(p => ({
        id: p._id.toString(),
        ...p,
      })),
    });
  } catch (error: any) {
    console.error("Get promos error:", error);
    return NextResponse.json(
      { error: "Failed to get promos" },
      { status: 500 }
    );
  }
}
