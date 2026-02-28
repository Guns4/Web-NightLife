/**
 * =====================================================
 * API VENUES [SLUG]
 * Deep Fetch: Venue details with promos, reviews, gallery
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PromoService } from "@/lib/services/promo/mongo-promo-service";

const prisma = new PrismaClient();
const promoService = new PromoService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Fetch venue from PostgreSQL
    const venue = await prisma.venue.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // 2. Fetch reviews from PostgreSQL (VibeChecks as reviews)
    const reviews = await prisma.vibeCheck.findMany({
      where: {
        venueId: venue.id,
        isVerifiedVisit: true,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 3. Calculate Trust Score from verified reviews
    const verifiedReviews = reviews.filter((r: any) => r.isVerifiedPurchase);
    const trustScore = verifiedReviews.length > 0
      ? verifiedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / verifiedReviews.length
      : 50;

    // 4. Fetch active promos from MongoDB
    let promos: any[] = [];
    try {
      promos = await promoService.getVenuePromos(venue.id, { activeOnly: true });
    } catch (error) {
      console.warn("Failed to fetch promos from MongoDB:", error);
      // Continue without promos if MongoDB is unavailable
    }

    // 5. Transform reviews
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isVerifiedVisit: review.isVerifiedVisit,
      aiVerificationConfidence: review.aiVerificationConfidence,
      createdAt: review.createdAt,
      user: review.user
        ? {
            id: review.user.id,
            displayName: review.user.displayName,
            avatarUrl: review.user.avatarUrl,
          }
        : null,
    }));

    // 6. Transform promos
    const transformedPromos = promos.map((promo) => ({
      id: promo._id?.toString() || promo.id,
      type: promo.type,
      title: promo.title || promo.packageName || "",
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      priceValue: promo.priceValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      isActive: promo.isActive,
      imageUrl: promo.imageUrl,
      isFeatured: promo.isFeatured,
      details: promo.details || null,
    }));

    // 7. Build the response
    const response = {
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        category: venue.category,
        latitude: venue.latitude,
        longitude: venue.longitude,
        musicGenres: venue.musicGenres,
        vibes: venue.vibes,
        facilities: venue.facilities,
        isActive: venue.isActive,
        isVerified: venue.isVerified,
        isBoosted: venue.isBoosted,
        boostExpiry: venue.boostExpiry,
        trustScore: Number(trustScore.toFixed(1)),
        galleryImages: venue.galleryImages,
        createdAt: venue.createdAt,
        updatedAt: venue.updatedAt,
        owner: venue.owner,
      },
      reviews: {
        items: transformedReviews,
        total: reviews.length,
        verifiedCount: verifiedReviews.length,
        averageRating:
          verifiedReviews.length > 0
            ? Number(
                (
                  verifiedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
                  verifiedReviews.length
                ).toFixed(1)
              )
            : null,
      },
      promos: {
        items: transformedPromos,
        total: transformedPromos.length,
      },
      stats: {
        totalReviews: reviews.length,
        verifiedReviews: verifiedReviews.length,
        totalPromos: transformedPromos.length,
        activePromos: transformedPromos.filter((p) => p.isActive).length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Venue detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch venue details" },
      { status: 500 }
    );
  }
}
