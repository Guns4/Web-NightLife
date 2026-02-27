"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";
import { validateInput, promoSchema, liveVibeSchema } from "../validations";
import { Venue, Promo, VenueCategory, PriceMetadata } from "../database/types";

/**
 * Get owner's venues
 */
export async function getOwnerVenues(ownerId: string): Promise<Venue[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getOwnerVenues error:", error);
    return [];
  }
}

/**
 * Get single venue for editing
 */
export async function getVenueForEdit(venueId: string, ownerId: string): Promise<Venue | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .eq("owner_id", ownerId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("getVenueForEdit error:", error);
    return null;
  }
}

/**
 * Create new venue
 */
export async function createVenue(
  ownerId: string,
  venueData: {
    name: string;
    category: VenueCategory;
    city: string;
    description?: string;
    address?: string;
    price_range?: number;
    features?: string[];
    images?: string[];
    price_metadata?: PriceMetadata;
  }
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    // Validate input
    const validation = await validateInput(promoSchema, { ...venueData, venue_id: "placeholder" });
    if (!validation.success) {
      return { success: false, error: validation.errors.join(", ") };
    }

    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    const { data, error } = await supabase
      .from("venues")
      .insert({
        ...venueData,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/owner");
    return { success: true, venue: data };
  } catch (error: any) {
    console.error("createVenue error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update venue
 */
export async function updateVenue(
  venueId: string,
  ownerId: string,
  venueData: Partial<Venue>
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .single();

    if (!existing || existing.owner_id !== ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("venues")
      .update({ ...venueData, updated_at: new Date().toISOString() })
      .eq("id", venueId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/owner");
    revalidatePath(`/dashboard/owner/venue/${venueId}`);
    return { success: true, venue: data };
  } catch (error: any) {
    console.error("updateVenue error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get promos for a venue
 */
export async function getVenuePromos(venueId: string): Promise<Promo[]> {
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
 * Create promo
 */
export async function createPromo(
  venueId: string,
  ownerId: string,
  promoData: {
    title: string;
    description?: string;
    price_value?: number;
    start_date: string;
    end_date: string;
    day_of_week?: number[];
    is_flash_deal?: boolean;
  }
): Promise<{ success: boolean; promo?: Promo; error?: string }> {
  try {
    // Validate input
    const validation = await validateInput(promoSchema, {
      ...promoData,
      venue_id: venueId,
    });
    if (!validation.success) {
      return { success: false, error: validation.errors.join(", ") };
    }

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
        ...promoData,
        venue_id: venueId,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/owner/promos");
    return { success: true, promo: data };
  } catch (error: any) {
    console.error("createPromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update promo
 */
export async function updatePromo(
  promoId: string,
  ownerId: string,
  promoData: Partial<Promo>
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
    console.error("updatePromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete promo
 */
export async function deletePromo(
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
    console.error("deletePromo error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update live vibe status
 */
export async function updateLiveVibe(
  venueId: string,
  ownerId: string,
  status: "quiet" | "crowded" | "full",
  musicGenre?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = await validateInput(liveVibeSchema, {
      venue_id: venueId,
      status,
      music_genre: musicGenre,
    });
    if (!validation.success) {
      return { success: false, error: validation.errors.join(", ") };
    }

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

    const { error } = await supabase
      .from("live_vibe_status")
      .upsert({
        venue_id: venueId,
        status,
        music_genre: musicGenre,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "venue_id",
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("updateLiveVibe error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get analytics for venue
 */
export async function getVenueAnalytics(
  venueId: string,
  ownerId: string,
  days: number = 7
): Promise<{
  views: number;
  clicks: number;
  leads: number;
  dailyData: { date: string; views: number; clicks: number }[];
} | null> {
  try {
    if (!supabase) return null;

    // Verify ownership
    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .single();

    if (!venue || venue.owner_id !== ownerId) {
      return null;
    }

    // For now, return mock data - in production, you'd have analytics tables
    const mockDailyData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split("T")[0],
        views: Math.floor(Math.random() * 200) + 50,
        clicks: Math.floor(Math.random() * 50) + 10,
      };
    });

    const totalViews = mockDailyData.reduce((sum, d) => sum + d.views, 0);
    const totalClicks = mockDailyData.reduce((sum, d) => sum + d.clicks, 0);

    return {
      views: totalViews,
      clicks: totalClicks,
      leads: Math.floor(totalClicks * 0.3),
      dailyData: mockDailyData,
    };
  } catch (error) {
    console.error("getVenueAnalytics error:", error);
    return null;
  }
}
