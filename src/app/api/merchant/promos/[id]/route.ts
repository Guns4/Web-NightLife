/**
 * =====================================================
 * API MERCHANT PROMO [ID]
 * PUT / DELETE single promo
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { promoService } from "@/lib/services/promo/mongo-promo-service";
import { verifyAccessToken } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/prisma-client";
import { ObjectId } from "mongodb";

// PUT - Update promo
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || !['OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get existing promo
    const existingPromo = await promoService.getPromoById(id);
    if (!existingPromo) {
      return NextResponse.json(
        { error: "Promo not found" },
        { status: 404 }
      );
    }

    // Verify venue ownership
    const venue = await prisma.venue.findUnique({
      where: { id: existingPromo.venueId },
      select: { ownerId: true },
    });

    if (!venue || venue.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't own this venue" },
        { status: 403 }
      );
    }

    // Parse update body
    const body = await req.json();
    const {
      title,
      description,
      promoType,
      promoData,
      startDate,
      endDate,
      imageUrl,
      isActive,
      isFeatured,
    } = body as {
      title?: string;
      description?: string;
      promoType?: string;
      promoData?: any;
      startDate?: string;
      endDate?: string;
      imageUrl?: string;
      isActive?: boolean;
      isFeatured?: boolean;
    };

    // Build updates object
    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (promoType) updates.promoType = promoType;
    if (promoData) updates.promoData = promoData;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate) updates.endDate = new Date(endDate);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;

    // Update promo
    const updatedPromo = await promoService.updatePromo(id, updates);

    return NextResponse.json({
      success: true,
      promo: {
        id: updatedPromo?._id.toString(),
        ...updatedPromo,
      },
    });
  } catch (error: any) {
    console.error("Update promo error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update promo" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (deactivate) promo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || !['OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get existing promo
    const existingPromo = await promoService.getPromoById(id);
    if (!existingPromo) {
      return NextResponse.json(
        { error: "Promo not found" },
        { status: 404 }
      );
    }

    // Verify venue ownership
    const venue = await prisma.venue.findUnique({
      where: { id: existingPromo.venueId },
      select: { ownerId: true },
    });

    if (!venue || venue.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't own this venue" },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    await promoService.updatePromo(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: "Promo deactivated (soft deleted)",
    });
  } catch (error: any) {
    console.error("Delete promo error:", error);
    return NextResponse.json(
      { error: "Failed to delete promo" },
      { status: 500 }
    );
  }
}
