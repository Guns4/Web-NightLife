"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";
import { 
  Venue, 
  VenueWithRelations, 
  Promo, 
  LiveVibe, 
  VenueFilters,
  VenueCategory,
  Atmosphere,
  PriceMetadata 
} from "../database/types";
import { calculateDistance } from "../utils/geo";

/**
 * Get recommended venues with smart prioritization
 * Prioritizes: Verified venues, Active promos tonight, Higher ratings
 */
export async function getRecommendedVenues(limit: number = 10): Promise<VenueWithRelations[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    const now = new Date().toISOString();
    const today = new Date().getDay();

    // First get venues with their promos
    let query = supabase
      .from("venues")
      .select(`
        *,
        promos!inner(*),
        live_vibe_status(*)
      `)
      .eq("is_active", true)
      .order("is_verified", { ascending: false })
      .order("rating", { ascending: false })
      .limit(limit * 2); // Get more to filter

    const { data: venues, error } = await query;

    if (error) {
      console.error("Error fetching recommended venues:", error);
      return [];
    }

    // Filter and process venues
    const processedVenues: VenueWithRelations[] = [];
    
    for (const venue of venues || []) {
      // Check if venue has active promo tonight
      const tonightPromo = venue.promos?.find((promo: Promo) => 
        promo.is_active && 
        promo.start_date <= now && 
        promo.end_date >= now &&
        (promo.day_of_week === null || promo.day_of_week.includes(today))
      );

      // Get live vibe status
      const liveVibe = venue.live_vibe_status?.[0] as LiveVibe | undefined;

      processedVenues.push({
        ...venue,
        promos: tonightPromo ? [tonightPromo] : [],
        live_vibe: liveVibe || null,
        average_rating: venue.rating || 0,
      });
    }

    // Sort by: verified first, then has promo, then rating
    processedVenues.sort((a, b) => {
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      if ((a.promos?.length || 0) > (b.promos?.length || 0)) return -1;
      if ((b.promos?.length || 0) > (a.promos?.length || 0)) return 1;
      return (b.average_rating || 0) - (a.average_rating || 0);
    });

    return processedVenues.slice(0, limit);
  } catch (error) {
    console.error("getRecommendedVenues error:", error);
    return [];
  }
}

/**
 * Get venues by vibe/atmosphere filtering
 * Filters based on tag_vibe from vibe_checks
 */
export async function getVenuesByVibe(
  atmospheres: Atmosphere[],
  limit: number = 20
): Promise<VenueWithRelations[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    // Get venues that have vibe checks with matching tags
    const { data: matchingVibeChecks, error: vibeError } = await supabase
      .from("vibe_checks")
      .select("venue_id, tag_vibe")
      .contains("tag_vibe", atmospheres);

    if (vibeError) {
      console.error("Error fetching vibe checks:", vibeError);
      return [];
    }

    // Get unique venue IDs
    const venueIds = [...new Set(matchingVibeChecks?.map(vc => vc.venue_id) || [])];

    if (venueIds.length === 0) {
      return [];
    }

    // Fetch venues with those IDs
    const { data: venues, error } = await supabase
      .from("venues")
      .select(`
        *,
        promos(*),
        live_vibe_status(*),
        vibe_checks(*)
      `)
      .eq("is_active", true)
      .in("id", venueIds)
      .order("rating", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching venues by vibe:", error);
      return [];
    }

    // Calculate average ratings
    return (venues || []).map(venue => {
      const vibeChecks = venue.vibe_checks || [];
      const averageRating = vibeChecks.length > 0
        ? vibeChecks.reduce((sum: number, vc: any) => sum + vc.rating, 0) / vibeChecks.length
        : venue.rating || 0;

      return {
        ...venue,
        average_rating: averageRating,
      };
    });
  } catch (error) {
    console.error("getVenuesByVibe error:", error);
    return [];
  }
}

/**
 * Get realtime pricing for transparency badge
 * Fetches price_metadata and formats it
 */
export async function getRealtimePricing(venueId: string): Promise<PriceMetadata | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    const { data, error } = await supabase
      .from("venues")
      .select("price_metadata, price_range")
      .eq("id", venueId)
      .single();

    if (error) {
      console.error("Error fetching pricing:", error);
      return null;
    }

    // Return price_metadata or generate from price_range
    if (data.price_metadata) {
      return data.price_metadata as PriceMetadata;
    }

    // Generate metadata from price_range
    const basePrice = data.price_range || 2;
    return {
      minimumCharge: basePrice * 150000,
      coverCharge: basePrice * 50000,
    };
  } catch (error) {
    console.error("getRealtimePricing error:", error);
    return null;
  }
}

/**
 * Get live vibe status for multiple venues
 */
export async function getLiveVibeStatuses(venueIds: string[]): Promise<Map<string, LiveVibe>> {
  try {
    if (!supabase || venueIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from("live_vibe_status")
      .select("*")
      .in("venue_id", venueIds);

    if (error) {
      console.error("Error fetching live vibes:", error);
      return new Map();
    }

    const vibeMap = new Map<string, LiveVibe>();
    (data || []).forEach(vibe => {
      vibeMap.set(vibe.venue_id, vibe);
    });

    return vibeMap;
  } catch (error) {
    console.error("getLiveVibeStatuses error:", error);
    return new Map();
  }
}

/**
 * Toggle favorite for a venue
 */
export async function toggleFavorite(
  userId: string, 
  venueId: string
): Promise<{ isFavorite: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { isFavorite: false, error: "Supabase not configured" };
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("saved_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("venue_id", venueId)
      .single();

    if (existing) {
      // Remove favorite
      await supabase
        .from("saved_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("venue_id", venueId);

      return { isFavorite: false };
    } else {
      // Add favorite
      await supabase
        .from("saved_favorites")
        .insert({ user_id: userId, venue_id: venueId });

      return { isFavorite: true };
    }
  } catch (error) {
    console.error("toggleFavorite error:", error);
    return { isFavorite: false, error: "Failed to toggle favorite" };
  }
}

/**
 * Get user's favorite venues
 */
export async function getUserFavorites(userId: string): Promise<Venue[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    const { data, error } = await supabase
      .from("saved_favorites")
      .select("venues(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }

    return (data || [])
      .map((f: any) => f.venues as Venue)
      .filter((v): v is Venue => v !== null);
  } catch (error) {
    console.error("getUserFavorites error:", error);
    return [];
  }
}

/**
 * Get venues near user location with dynamic radius
 * Uses client-side distance calculation
 */
export async function getVenuesNearMe(
  userLat: number,
  userLng: number,
  initialRadiusKm: number = 5,
  maxRadiusKm: number = 15,
  limit: number = 20
): Promise<{
  venues: VenueWithRelations[];
  expandedRadius: boolean;
  usedRadius: number;
}> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return { venues: [], expandedRadius: false, usedRadius: initialRadiusKm };
    }

    let currentRadius = initialRadiusKm;
    let venues: VenueWithRelations[] = [];
    let expandedRadius = false;

    // Try fetching with increasing radius until we find venues
    while (currentRadius <= maxRadiusKm) {
      // Fetch venues from database (we'll filter client-side)
      const { data, error } = await supabase
        .from("venues")
        .select(`
          *,
          promos(*),
          live_vibe_status(*)
        `)
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(100); // Fetch more to filter client-side

      if (error) {
        console.error("Error fetching venues:", error);
        break;
      }

      // Calculate distance and filter
      const now = new Date().toISOString();
      const today = new Date().getDay();

      const filteredVenues: VenueWithRelations[] = (data || [])
        .map((venue: any) => {
          // Parse coordinates if available
          let distance = Infinity;
          if (venue.coordinates) {
            const coords = typeof venue.coordinates === 'string' 
              ? JSON.parse(venue.coordinates) 
              : venue.coordinates;
            if (coords?.lat && coords?.lng) {
              distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
            }
          }
          
          // Only include venues within current radius
          if (distance > currentRadius) return null;

          // Find active promo for tonight
          const tonightPromo = venue.promos?.find((promo: Promo) => 
            promo.is_active && 
            promo.start_date <= now && 
            promo.end_date >= now &&
            (promo.day_of_week === null || promo.day_of_week.includes(today))
          );

          return {
            ...venue,
            distance_km: distance,
            promos: tonightPromo ? [tonightPromo] : [],
            average_rating: venue.rating || 0,
          } as VenueWithRelations;
        })
        .filter((v): v is VenueWithRelations => v !== null)
        .sort((a, b) => {
          // First prioritize boosted venues
          const aIsBoosted = (a as any).is_boosted === true || (a as any).is_boosted === 'true';
          const bIsBoosted = (b as any).is_boosted === true || (b as any).is_boosted === 'true';
          if (aIsBoosted && !bIsBoosted) return -1;
          if (!aIsBoosted && bIsBoosted) return 1;
          // Then prioritize venues with promos
          const aHasPromo = (a.promos?.length || 0) > 0;
          const bHasPromo = (b.promos?.length || 0) > 0;
          if (aHasPromo && !bHasPromo) return -1;
          if (!aHasPromo && bHasPromo) return 1;
          // Then sort by rating (descending)
          const aRating = a.average_rating || 0;
          const bRating = b.average_rating || 0;
          if (bRating !== aRating) return bRating - aRating;
          // Then sort by distance
          return (a.distance_km || Infinity) - (b.distance_km || Infinity);
        });

      venues = filteredVenues.slice(0, limit);

      if (venues.length > 0 || currentRadius >= maxRadiusKm) {
        break;
      }

      // Expand radius
      currentRadius = currentRadius === 5 ? 10 : 15;
      expandedRadius = currentRadius > initialRadiusKm;
    }

    return {
      venues,
      expandedRadius,
      usedRadius: currentRadius,
    };
  } catch (error) {
    console.error("getVenuesNearMe error:", error);
    return { venues: [], expandedRadius: false, usedRadius: initialRadiusKm };
  }
}

/**
 * Update live vibe status (for venue owners/admins)
 */
export async function updateLiveVibeStatus(
  venueId: string,
  status: 'quiet' | 'crowded' | 'full',
  musicGenre?: string
): Promise<LiveVibe | null> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return null;
    }

    // Upsert live vibe status
    const { data, error } = await supabase
      .from("live_vibe_status")
      .upsert({
        venue_id: venueId,
        status,
        music_genre: musicGenre,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'venue_id'
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating live vibe:", error);
      return null;
    }

    revalidatePath("/venues");
    return data;
  } catch (error) {
    console.error("updateLiveVibeStatus error:", error);
    return null;
  }
}

/**
 * Search venues with advanced filters
 */
export async function searchVenuesAdvanced(
  filters: VenueFilters,
  limit: number = 20
): Promise<VenueWithRelations[]> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return [];
    }

    let query = supabase
      .from("venues")
      .select(`
        *,
        promos(*),
        live_vibe_status(*)
      `)
      .eq("is_active", true);

    // Apply text search
    if (filters.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%`
      );
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    // Apply city filter
    if (filters.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }

    // Apply price range filters
    if (filters.priceMin) {
      query = query.gte("price_range", filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte("price_range", filters.priceMax);
    }

    // Apply verified filter
    if (filters.verifiedOnly) {
      query = query.eq("is_verified", true);
    }

    const { data, error } = await query
      .order("is_verified", { ascending: false })
      .order("rating", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error searching venues:", error);
      return [];
    }

    // If atmosphere filter is applied, filter further
    if (filters.atmosphere && filters.atmosphere.length > 0) {
      const venueIds = (data || []).map(v => v.id);
      
      if (venueIds.length > 0) {
        const { data: vibeChecks } = await supabase
          .from("vibe_checks")
          .select("venue_id, tag_vibe")
          .in("venue_id", venueIds)
          .contains("tag_vibe", filters.atmosphere);

        const matchingVenueIds = new Set(vibeChecks?.map(vc => vc.venue_id) || []);
        
        return (data || [])
          .filter(v => matchingVenueIds.has(v.id))
          .map(venue => ({
            ...venue,
            average_rating: venue.rating || 0,
          }));
      }
    }

    return (data || []).map(venue => ({
      ...venue,
      average_rating: venue.rating || 0,
    }));
  } catch (error) {
    console.error("searchVenuesAdvanced error:", error);
    return [];
  }
}
