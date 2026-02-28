/**
 * =====================================================
 * AD CHECKOUT API
 * Connect Dynamic Pricing to Checkout Flow
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateAdPrice, formatPrice, type AdSlotType, type PriceBreakdown } from "@/lib/pricing/dynamic-pricing";
import { prisma } from "@/lib/auth/prisma-client";
import { logger, log } from "@/lib/server/logger";

// POST /api/checkout/ad - Calculate ad price
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { venueId, slotType, dates } = body as {
      venueId: string;
      slotType: AdSlotType;
      dates: string[];
    };

    // Validate required fields
    if (!venueId || !slotType || !dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: venueId, slotType, dates" },
        { status: 400 }
      );
    }

    // Validate slot type
    const validSlots: AdSlotType[] = ["homepage_banner", "top_search", "featured_card"];
    if (!validSlots.includes(slotType)) {
      return NextResponse.json(
        { error: `Invalid slot type. Must be one of: ${validSlots.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate dates
    const parsedDates = dates.map(d => {
      const date = new Date(d);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${d}`);
      }
      return date.toISOString().split("T")[0];
    });

    // Fetch venue with city and merchant info
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        city: true,
        ownerId: true,
        createdAt: true,
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Get merchant signup date for intro pricing
    let merchantSignupDate: string | undefined;
    if (venue.ownerId) {
      const merchant = await prisma.user.findUnique({
        where: { id: venue.ownerId },
        select: { createdAt: true },
      });
      if (merchant) {
        merchantSignupDate = merchant.createdAt.toISOString();
      }
    }

    // Calculate price using dynamic pricing engine
    const priceBreakdown = await calculateAdPrice(
      venueId,
      slotType,
      parsedDates,
      venue.city || "Jakarta",
      merchantSignupDate
    );

    // Build response
    const response = {
      venue: {
        id: venue.id,
        name: venue.name,
        city: venue.city,
      },
      slotType,
      dates: parsedDates,
      pricing: {
        ...priceBreakdown,
        totalFormatted: formatPrice(priceBreakdown.totalAfterDiscount),
        baseFormatted: formatPrice(priceBreakdown.basePrice),
        weekendSurchargeFormatted: formatPrice(priceBreakdown.weekendSurcharge),
        vipDiscountFormatted: formatPrice(priceBreakdown.vipDiscount),
      },
      // Pricing info for transparency
      pricingInfo: {
        pricingType: priceBreakdown.pricingType,
        cityTier: priceBreakdown.cityTier,
        introDaysRemaining: priceBreakdown.daysRemaining,
        isVip: priceBreakdown.isVip,
        isWeekend: priceBreakdown.isWeekend,
      },
    };

    log.venue.search(`${slotType} quote`, parsedDates.length, Date.now());

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, "Checkout price calculation failed");
    return NextResponse.json(
      { error: error.message || "Failed to calculate price" },
      { status: 500 }
    );
  }
}

// GET /api/checkout/ad - Get pricing tiers info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotType = searchParams.get("slotType") as AdSlotType | null;

    // Return pricing tiers info
    const pricingInfo = {
      slots: {
        homepage_banner: {
          name: "Homepage Banner",
          description: "Top banner on the homepage",
          introPrice: formatPrice(300000),
          normalPrice: formatPrice(450000),
        },
        top_search: {
          name: "Top Search",
          description: "Appears at top of search results",
          introPrice: formatPrice(200000),
          normalPrice: formatPrice(300000),
        },
        featured_card: {
          name: "Featured Card",
          description: "Highlighted venue card",
          introPrice: formatPrice(150000),
          normalPrice: formatPrice(225000),
        },
      },
      cityTiers: {
        TIER_1: {
          name: "Tier 1 Cities",
          cities: ["Jakarta", "Bali"],
          multiplier: "1.5x",
        },
        TIER_2: {
          name: "Tier 2 Cities",
          cities: ["Surabaya", "Bandung", "Medan"],
          multiplier: "1.2x",
        },
        TIER_3: {
          name: "Tier 3 Cities",
          cities: "All other cities in Indonesia",
          multiplier: "1.0x",
        },
      },
      discounts: {
        weekend: "40% surcharge (Fri-Sat)",
        vip: "15% discount (7+ days)",
      },
      introPeriod: {
        days: 130,
        deadline: "August 1, 2026",
        note: "Intro pricing ends 130 days after first merchant signup",
      },
    };

    // If specific slot requested, return just that info
    if (slotType && pricingInfo.slots[slotType as keyof typeof pricingInfo.slots]) {
      return NextResponse.json({
        slot: slotType,
        ...pricingInfo.slots[slotType as keyof typeof pricingInfo.slots],
        cityTiers: pricingInfo.cityTiers,
        discounts: pricingInfo.discounts,
        introPeriod: pricingInfo.introPeriod,
      });
    }

    return NextResponse.json(pricingInfo);
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to get pricing info");
    return NextResponse.json(
      { error: "Failed to get pricing info" },
      { status: 500 }
    );
  }
}
