/**
 * =====================================================
 * ADS PLACEMENT SERVICE
 * Handles boosted venue injection into discovery results
 * Supports: Tier 1 (Home Banner), Tier 2 (Top Search), Tier 3 (Featured Card)
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";

export type AdTier = 'homepage_banner' | 'top_search' | 'featured_card';

interface BoostedVenue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  category: string;
  musicGenres: string[];
  vibes: string[];
  facilities: string[];
  isVerified: boolean;
  isBoosted: boolean;
  boostType: AdTier | null;
  trustScore: number;
  galleryImages: string[];
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number;
}

interface VenueSearchOptions {
  lat: number;
  lng: number;
  radiusKm?: number;
  category?: string;
  city?: string;
  musicGenres?: string[];
  vibes?: string[];
  facilities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'distance' | 'trust_score' | 'name';
}

interface VenueSearchResult {
  venues: BoostedVenue[];
  boostedVenues: BoostedVenue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get boosted venues by tier
 */
async function getBoostedVenues(tier?: AdTier): Promise<BoostedVenue[]> {
  const where: any = {
    isActive: true,
    isBoosted: true,
  };

  if (tier) {
    where.boostType = tier;
  }

  const venues = await prisma.venue.findMany({
    where,
    orderBy: { trustScore: 'desc' },
    take: 10,
  });

  return venues as BoostedVenue[];
}

/**
 * Inject boosted venues into search results based on tier
 */
export async function searchVenuesWithAds(
  options: VenueSearchOptions
): Promise<VenueSearchResult> {
  const {
    lat,
    lng,
    radiusKm = 10,
    category,
    city,
    musicGenres,
    vibes,
    facilities,
    page = 1,
    limit = 20,
    sortBy = 'distance',
  } = options;

  // Get boosted venues
  const boostedVenues = await getBoostedVenues();
  
  // Build main search query (excluding boosted venues)
  const boostedIds = boostedVenues.map(v => v.id);
  
  let whereClause = `v."isActive" = true`;
  
  // Exclude boosted venues from main results
  if (boostedIds.length > 0) {
    const idsList = boostedIds.map(id => `'${id}'`).join(', ');
    whereClause += ` AND v.id NOT IN (${idsList})`;
  }

  // Add filters
  if (category) {
    whereClause += ` AND v.category = '${category}'`;
  }

  if (city) {
    whereClause += ` AND LOWER(v.city) LIKE LOWER('%${city}%')`;
  }

  if (musicGenres && musicGenres.length > 0) {
    const genresArray = musicGenres.map(g => `'${g.trim()}'`).join(", ");
    whereClause += ` AND v."musicGenres" @> ARRAY[${genresArray}]::text[]`;
  }

  if (vibes && vibes.length > 0) {
    const vibesArray = vibes.map(v => `'${v.trim()}'`).join(", ");
    whereClause += ` AND v.vibes @> ARRAY[${vibesArray}]::text[]`;
  }

  if (facilities && facilities.length > 0) {
    const facilitiesArray = facilities.map(f => `'${f.trim()}'`).join(", ");
    whereClause += ` AND v.facilities @> ARRAY[${facilitiesArray}]::text[]`;
  }

  // Build ORDER BY
  let orderByClause = '';
  switch (sortBy) {
    case 'trust_score':
      orderByClause = '"trustScore" DESC';
      break;
    case 'name':
      orderByClause = '"name" ASC';
      break;
    case 'distance':
    default:
      orderByClause = 'distance ASC';
      break;
  }

  const radiusMeters = radiusKm * 1000;
  const offset = (page - 1) * limit;

  // Main query
  const query = `
    SELECT 
      v.id,
      v.name,
      v.slug,
      v.description,
      v.address,
      v.city,
      v.category,
      v."musicGenres",
      v.vibes,
      v.facilities,
      v."isVerified",
      v."isBoosted",
      v."boostType",
      v."trustScore",
      v."galleryImages",
      v.latitude,
      v.longitude,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS distance_meters
    FROM "Venue" v
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Venue" v
    ${whereClause}
  `;

  // Execute
  const { PrismaClient } = await import("@prisma/client");
  const prismaClient = new PrismaClient();
  
  const venues: any[] = await prismaClient.$queryRawUnsafe(query);
  const countResult: any[] = await prismaClient.$queryRawUnsafe(countQuery);

  const total = Number(countResult[0]?.total || 0);

  // Transform results
  const transformedVenues: BoostedVenue[] = (venues as any[]).map((venue) => ({
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    description: venue.description,
    address: venue.address,
    city: venue.city,
    category: venue.category,
    musicGenres: venue.musicGenres || [],
    vibes: venue.vibes || [],
    facilities: venue.facilities || [],
    isVerified: venue.isVerified,
    isBoosted: false, // Main results are non-boosted
    boostType: null,
    trustScore: Number(venue.trustScore) || 50,
    galleryImages: venue.galleryImages || [],
    latitude: venue.latitude ? Number(venue.latitude) : null,
    longitude: venue.longitude ? Number(venue.longitude) : null,
    distanceKm: venue.distance_meters ? Number(venue.distance_meters) / 1000 : undefined,
  }));

  // Inject boosted venues at appropriate positions
  const homepageBannerVenues = boostedVenues.filter(v => v.boostType === 'homepage_banner');
  const topSearchVenues = boostedVenues.filter(v => v.boostType === 'top_search');
  const featuredCardVenues = boostedVenues.filter(v => v.boostType === 'featured_card');

  // Inject homepage banners at the very top (max 3)
  const finalVenues: BoostedVenue[] = [...transformedVenues];
  
  // Inject at position 0-2 (homepage banner)
  homepageBannerVenues.slice(0, 3).forEach((venue, index) => {
    finalVenues.splice(index, 0, { ...venue, isBoosted: true });
  });

  // Inject after every 5 results (top search)
  topSearchVenues.forEach((venue, index) => {
    const insertPosition = 5 * (index + 1) + index;
    if (insertPosition < finalVenues.length) {
      finalVenues.splice(insertPosition, 0, { ...venue, isBoosted: true });
    } else {
      finalVenues.push({ ...venue, isBoosted: true });
    }
  });

  // Mark featured cards in the results
  featuredCardVenues.forEach((venue) => {
    const index = finalVenues.findIndex(v => v.id === venue.id);
    if (index === -1) {
      finalVenues.push({ ...venue, isBoosted: true });
    }
  });

  return {
    venues: finalVenues.slice(0, limit),
    boostedVenues,
    pagination: {
      page,
      limit,
      total: total + boostedVenues.length,
      totalPages: Math.ceil((total + boostedVenues.length) / limit),
    },
  };
}

/**
 * Get homepage banner ads (for hero section)
 */
export async function getHomepageBanners(): Promise<BoostedVenue[]> {
  return getBoostedVenues('homepage_banner');
}

/**
 * Get top search ads
 */
export async function getTopSearchAds(): Promise<BoostedVenue[]> {
  return getBoostedVenues('top_search');
}

/**
 * Get featured card ads
 */
export async function getFeaturedCards(): Promise<BoostedVenue[]> {
  return getBoostedVenues('featured_card');
}
