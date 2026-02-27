"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";
import { 
  Venue, 
  VenueWithRelations, 
  Promo, 
  VibeCheck,
  VenueFilters,
  VenueCategory 
} from "../database/types";

/**
 * Get all venues with optional filters
 * Optimized for dynamic filtering (Category, City, Price Range)
 */
export async function getVenues(filters?: VenueFilters): Promise<Venue[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    let query = supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .order("rating", { ascending: false });

    // Apply filters
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }

    if (filters?.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%`
      );
    }

    if (filters?.priceMin) {
      query = query.gte("price_range", filters.priceMin);
    }

    if (filters?.priceMax) {
      query = query.lte("price_range", filters.priceMax);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching venues:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("getVenues error:", error);
    return [];
  }
}

/**
 * Get venue by ID with all related data
 * Includes Active Promos and Vibe Checks
 */
export async function getVenueById(venueId: string): Promise<VenueWithRelations | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    // Fetch venue
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .single();

    if (venueError) {
      console.error("Error fetching venue:", venueError);
      return null;
    }

    // Fetch active promos for the venue
    const now = new Date().toISOString();
    const { data: promos } = await supabase
      .from("promos")
      .select("*")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("price_value", { ascending: true });

    // Fetch vibe checks with user info
    const { data: vibeChecks } = await supabase
      .from("vibe_checks")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate average rating
    const averageRating = vibeChecks && vibeChecks.length > 0
      ? vibeChecks.reduce((sum, vc) => sum + vc.rating, 0) / vibeChecks.length
      : venue.rating || 0;

    return {
      ...venue,
      promos: promos || [],
      vibe_checks: vibeChecks || [],
      average_rating: averageRating,
    };
  } catch (error) {
    console.error("getVenueById error:", error);
    return null;
  }
}

/**
 * Search venues - Optimized for Hero Search Bar
 * Performs full-text search across name, description, city
 */
export async function searchVenues(searchQuery: string): Promise<Venue[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .or(
        `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
      )
      .order("rating", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error searching venues:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("searchVenues error:", error);
    return [];
  }
}

/**
 * Get venues by category
 */
export async function getVenuesByCategory(category: VenueCategory): Promise<Venue[]> {
  return getVenues({ category });
}

/**
 * Get venues by city
 */
export async function getVenuesByCity(city: string): Promise<Venue[]> {
  return getVenues({ city });
}

/**
 * Get featured/popular venues
 */
export async function getFeaturedVenues(limit: number = 6): Promise<Venue[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching featured venues:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("getFeaturedVenues error:", error);
    return [];
  }
}

/**
 * Get active promos for all venues
 */
export async function getActivePromos(): Promise<Promo[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("price_value", { ascending: true });

    if (error) {
      console.error("Error fetching promos:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("getActivePromos error:", error);
    return [];
  }
}

/**
 * Create a new venue (for venue owners)
 */
export async function createVenue(venueData: {
  name: string;
  category: VenueCategory;
  city: string;
  owner_id?: string;
  description?: string;
  address?: string;
  price_range?: number;
  features?: string[];
  images?: string[];
}): Promise<Venue | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    const { data, error } = await supabase
      .from("venues")
      .insert(venueData)
      .select()
      .single();

    if (error) {
      console.error("Error creating venue:", error);
      throw new Error(error.message);
    }

    revalidatePath("/venues");
    return data;
  } catch (error) {
    console.error("createVenue error:", error);
    return null;
  }
}

/**
 * Update a venue (for venue owners)
 */
export async function updateVenue(
  venueId: string,
  venueData: Partial<Venue>
): Promise<Venue | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    const { data, error } = await supabase
      .from("venues")
      .update(venueData)
      .eq("id", venueId)
      .select()
      .single();

    if (error) {
      console.error("Error updating venue:", error);
      throw new Error(error.message);
    }

    revalidatePath("/venues");
    revalidatePath(`/venues/${venueId}`);
    return data;
  } catch (error) {
    console.error("updateVenue error:", error);
    return null;
  }
}

/**
 * Delete a venue (for venue owners)
 */
export async function deleteVenue(venueId: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return false;
    }

    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", venueId);

    if (error) {
      console.error("Error deleting venue:", error);
      throw new Error(error.message);
    }

    revalidatePath("/venues");
    return true;
  } catch (error) {
    console.error("deleteVenue error:", error);
    return false;
  }
}

/**
 * Add a vibe check to a venue
 */
export async function addVibeCheck(
  venueId: string,
  userId: string,
  rating: number,
  comment?: string,
  tagVibe?: string[]
): Promise<VibeCheck | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    const { data, error } = await supabase
      .from("vibe_checks")
      .insert({
        venue_id: venueId,
        user_id: userId,
        rating,
        comment,
        tag_vibe: tagVibe,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding vibe check:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/venues/${venueId}`);
    return data;
  } catch (error) {
    console.error("addVibeCheck error:", error);
    return null;
  }
}
