"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";
import { Promo, Venue } from "../database/types";
import {
  calculateAdPrice,
  formatPrice,
  PriceBreakdown,
  AdSlotType,
  getCityTier,
  getPricingType,
  isIntroPeriod,
} from "../pricing/dynamic-pricing";

// Types for the new promo features
export interface MerchantPromo {
  id: string;
  venue_id: string;
  title: string;
  description?: string;
  promo_code?: string;
  discount_type: string;
  discount_value: number;
  min_spend?: number;
  max_discount?: number;
  start_date: string;
  end_date: string;
  day_of_week: number[];
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  poster_url?: string;
  target_category?: string;
  created_at: string;
}

export interface BoostSlot {
  id: string;
  name: string;
  description: string;
  price_per_day: number;
  icon: string;
}

export interface AdsOrder {
  id: string;
  venue_id: string;
  ad_type: string;
  duration_days: number;
  price_amount: number;
  status: string;
  starts_at: string;
  ends_at: string;
  impressions: number;
  clicks: number;
}

// Available boost slots with pricing
export const BOOST_SLOTS: BoostSlot[] = [
  {
    id: "homepage_banner",
    name: "Homepage Banner",
    description: "Premium banner placement on the homepage carousel",
    price_per_day: 500000,
    icon: "LayoutDashboard",
  },
  {
    id: "top_search",
    name: "Top Search Results",
    description: "Your venue appears at the top of search results",
    price_per_day: 300000,
    icon: "Search",
  },
  {
    id: "featured_card",
    name: "Featured Card",
    description: "Featured listing in the discover section",
    price_per_day: 200000,
    icon: "Star",
  },
];

/**
 * Get all promos for owner's venues
 */
export async function getOwnerPromos(ownerId: string): Promise<MerchantPromo[]> {
  try {
    if (!supabase) return [];

    const { data: venues } = await supabase
      .from("venues")
      .select("id")
      .eq("owner_id", ownerId);

    if (!venues || venues.length === 0) return [];

    const venueIds = venues.map((v) => v.id);

    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .in("venue_id", venueIds)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getOwnerPromos error:", error);
    return [];
  }
}

/**
 * Get promos for a specific venue
 */
export async function getVenuePromos(venueId: string): Promise<MerchantPromo[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getVenuePromos error:", error);
    return [];
  }
}

/**
 * Create a new promo with poster upload support
 */
export async function createMerchantPromo(
  venueId: string,
  ownerId: string,
  promoData: {
    title: string;
    description?: string;
    promo_code?: string;
    discount_type?: string;
    discount_value?: number;
    min_spend?: number;
    max_discount?: number;
    start_date: string;
    end_date: string;
    day_of_week?: number[];
    usage_limit?: number;
    poster_url?: string;
    target_category?: string;
  }
): Promise<{ success: boolean; promo?: MerchantPromo; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership
    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("promos")
      .insert({
        venue_id: venueId,
        title: promoData.title,
        description: promoData.description,
        promo_code: promoData.promo_code,
        discount_type: promoData.discount_type || "percentage",
        discount_value: promoData.discount_value,
        min_spend: promoData.min_spend,
        max_discount: promoData.max_discount,
        start_date: promoData.start_date,
        end_date: promoData.end_date,
        day_of_week: promoData.day_of_week || [0, 1, 2, 3, 4, 5, 6],
        usage_limit: promoData.usage_limit,
        poster_url: promoData.poster_url,
        target_category: promoData.target_category || "all",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/owner/promos");
    return { success: true, promo: data };
  } catch (error: any) {
    console.error("createMerchantPromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a promo
 */
export async function updateMerchantPromo(
  promoId: string,
  ownerId: string,
  promoData: Partial<MerchantPromo>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership through venue
    const { data: promo } = await supabase
      .from("promos")
      .select("venue_id")
      .eq("id", promoId)
      .single();

    if (!promo) return { success: false, error: "Promo not found" };

    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", promo.venue_id)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("promos")
      .update({ ...promoData, updated_at: new Date().toISOString() })
      .eq("id", promoId);

    if (error) throw error;

    revalidatePath("/dashboard/owner/promos");
    return { success: true };
  } catch (error: any) {
    console.error("updateMerchantPromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a promo
 */
export async function deleteMerchantPromo(
  promoId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership
    const { data: promo } = await supabase
      .from("promos")
      .select("venue_id")
      .eq("id", promoId)
      .single();

    if (!promo) return { success: false, error: "Promo not found" };

    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", promo.venue_id)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("promos")
      .delete()
      .eq("id", promoId);

    if (error) throw error;

    revalidatePath("/dashboard/owner/promos");
    return { success: true };
  } catch (error: any) {
    console.error("deleteMerchantPromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get boost status for a venue
 */
export async function getVenueBoostStatus(venueId: string): Promise<{
  is_boosted: boolean;
  boost_expiry: string | null;
  boost_slot: string | null;
} | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("venues")
      .select("is_boosted, boost_expiry, boost_slot")
      .eq("id", venueId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("getVenueBoostStatus error:", error);
    return null;
  }
}

/**
 * Purchase a boost for a venue
 */
export async function purchaseVenueBoost(
  venueId: string,
  ownerId: string,
  adType: string,
  durationDays: number
): Promise<{ success: boolean; order?: AdsOrder; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership
    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get price from boost slots
    const slot = BOOST_SLOTS.find((s) => s.id === adType);
    if (!slot) {
      return { success: false, error: "Invalid ad type" };
    }

    const totalPrice = slot.price_per_day * durationDays;
    const startsAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Create ads order
    const { data: order, error: orderError } = await supabase
      .from("ads_orders")
      .insert({
        venue_id: venueId,
        owner_id: ownerId,
        ad_type: adType,
        duration_days: durationDays,
        price_amount: totalPrice,
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Update venue with boost
    const { error: venueError } = await supabase
      .from("venues")
      .update({
        is_boosted: true,
        boost_expiry: endsAt,
        boost_slot: adType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", venueId);

    if (venueError) throw venueError;

    revalidatePath("/dashboard/owner/promos");
    return { success: true, order };
  } catch (error: any) {
    console.error("purchaseVenueBoost error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get ads orders for owner's venues
 */
export async function getOwnerAdsOrders(ownerId: string): Promise<AdsOrder[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("ads_orders")
      .select("*")
      .eq("owner_id", ownerId)
      .order("purchased_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getOwnerAdsOrders error:", error);
    return [];
  }
}

/**
 * Estimate promo reach based on venue analytics
 */
export async function estimatePromoReach(venueId: string): Promise<number> {
  try {
    if (!supabase) return 100; // Default fallback

    // Get last week's checkin count as a proxy for reach
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("checkins")
      .select("id")
      .eq("venue_id", venueId)
      .gte("created_at", oneWeekAgo);

    if (error || !data) return 100;

    // Return checkin count or default minimum of 100
    return Math.max(data.length * 10, 100); // Assuming each checkin represents ~10 views
  } catch (error) {
    console.error("estimatePromoReach error:", error);
    return 100;
  }
}

/**
 * Upload promo poster to Cloudinary (returns URL)
 */
export async function uploadPromoPoster(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // In production, this would upload to Cloudinary
    // For now, we'll create a mock URL
    const mockUrl = `https://res.cloudinary.com/demo/image/upload/v${Date.now()}/promo_${file.name.replace(/\s/g, "_")}`;

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true, url: mockUrl };
  } catch (error: any) {
    console.error("uploadPromoPoster error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle promo active status
 */
export async function togglePromoStatus(
  promoId: string,
  ownerId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership
    const { data: promo } = await supabase
      .from("promos")
      .select("venue_id")
      .eq("id", promoId)
      .single();

    if (!promo) return { success: false, error: "Promo not found" };

    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", promo.venue_id)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("promos")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", promoId);

    if (error) throw error;

    revalidatePath("/dashboard/owner/promos");
    return { success: true };
  } catch (error: any) {
    console.error("togglePromoStatus error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate dynamic price for ad purchase
 */
export async function calculateDynamicPrice(
  venueId: string,
  slotType: AdSlotType,
  startDate: string,
  durationDays: number
): Promise<{ success: boolean; breakdown?: PriceBreakdown; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Get venue and merchant info
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, city, owner_id, created_at")
      .eq("id", venueId)
      .single();

    if (venueError || !venue) {
      return { success: false, error: "Venue not found" };
    }

    // Get merchant signup date
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", venue.owner_id)
      .single();

    const merchantSignupDate = profile?.created_at || venue.created_at;

    // Generate dates array
    const dates: string[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Calculate price
    const breakdown = await calculateAdPrice(
      venueId,
      slotType,
      dates,
      venue.city,
      merchantSignupDate
    );

    return { success: true, breakdown };
  } catch (error: any) {
    console.error("calculateDynamicPrice error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get venue pricing info
 */
export async function getVenuePricingInfo(
  venueId: string
): Promise<{
  success: boolean;
  pricingInfo?: {
    city: string;
    cityTier: string;
    pricingType: string;
    introDaysRemaining: number;
    isIntro: boolean;
  };
  error?: string;
}> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    const { data: venue, error } = await supabase
      .from("venues")
      .select("id, city, owner_id, created_at")
      .eq("id", venueId)
      .single();

    if (error || !venue) {
      return { success: false, error: "Venue not found" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", venue.owner_id)
      .single();

    const merchantSignupDate = profile?.created_at || venue.created_at;
    const { isIntro, introDaysRemaining } = isIntroPeriod(merchantSignupDate);

    return {
      success: true,
      pricingInfo: {
        city: venue.city,
        cityTier: getCityTier(venue.city),
        pricingType: getPricingType(merchantSignupDate),
        introDaysRemaining,
        isIntro,
      },
    };
  } catch (error: any) {
    console.error("getVenuePricingInfo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Track ad impression (for CPC preparation)
 */
export async function trackAdImpression(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Get current impressions
    const { data: order } = await supabase
      .from("ads_orders")
      .select("impressions")
      .eq("id", orderId)
      .single();

    const newImpressions = (order?.impressions || 0) + 1;

    const { error } = await supabase
      .from("ads_orders")
      .update({ impressions: newImpressions })
      .eq("id", orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("trackAdImpression error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Track ad click (for CPC preparation)
 */
export async function trackAdClick(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Get current clicks
    const { data: order } = await supabase
      .from("ads_orders")
      .select("clicks")
      .eq("id", orderId)
      .single();

    const newClicks = (order?.clicks || 0) + 1;

    const { error } = await supabase
      .from("ads_orders")
      .update({ clicks: newClicks })
      .eq("id", orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("trackAdClick error:", error);
    return { success: false, error: error.message };
  }
}
