/**
 * =====================================================
 * API VENUES SEARCH
 * Near Me venue discovery with geospatial queries
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cache configuration for edge caching
const CACHE_REVALIDATE = 60; // seconds - revalidate every minute
const CACHE_MAX_AGE = 30; // seconds - stale-while-revalidate

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Required: User location
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    
    // Optional: Search radius in kilometers (default 10km)
    const radiusKm = parseFloat(searchParams.get("radius_km") || "10");
    
    // Optional: Category filter
    const category = searchParams.get("category");
    
    // Optional: Music genres filter (comma-separated)
    const musicGenres = searchParams.get("music_genres")?.split(",").filter(Boolean);
    
    // Optional: Vibes filter (comma-separated)
    const vibes = searchParams.get("vibes")?.split(",").filter(Boolean);
    
    // Optional: Facilities filter (comma-separated)
    const facilities = searchParams.get("facilities")?.split(",").filter(Boolean);
    
    // Optional: Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    // Optional: Sort by
    const sortBy = searchParams.get("sort_by") || "distance"; // distance, trust_score, name

    // Validate required parameters
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Build the raw SQL query with PostGIS
    // Using ST_DWithin for efficient radius search
    // Using ST_Distance for sorting by proximity
    let whereClause = `WHERE v."isActive" = true`;
    let havingClause = "";
    
    // Add category filter
    if (category) {
      whereClause += ` AND v.category = '${category}'`;
    }
    
    // Add music genres filter (AND logic - must have all specified)
    if (musicGenres && musicGenres.length > 0) {
      const genresArray = musicGenres.map(g => `'${g.trim()}'`).join(", ");
      whereClause += ` AND v."musicGenres" @> ARRAY[${genresArray}]::text[]`;
    }
    
    // Add vibes filter (AND logic)
    if (vibes && vibes.length > 0) {
      const vibesArray = vibes.map(v => `'${v.trim()}'`).join(", ");
      whereClause += ` AND v.vibes @> ARRAY[${vibesArray}]::text[]`;
    }
    
    // Add facilities filter (AND logic)
    if (facilities && facilities.length > 0) {
      const facilitiesArray = facilities.map(f => `'${f.trim()}'`).join(", ");
      whereClause += ` AND v.facilities @> ARRAY[${facilitiesArray}]::text[]`;
    }

    // Build ORDER BY clause
    let orderByClause = "";
    switch (sortBy) {
      case "trust_score":
        orderByClause = `"trustScore" DESC`;
        break;
      case "name":
        orderByClause = `"name" ASC`;
        break;
      case "distance":
      default:
        // For distance sorting, we need to calculate distance in the SELECT
        orderByClause = "distance ASC";
        break;
    }

    // Build the main query
    const radiusMeters = radiusKm * 1000;
    
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
        v."trustScore",
        v."galleryImages",
        v.latitude,
        v.longitude,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_meters,
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        ) AS within_radius
      FROM "Venue" v
      ${whereClause}
      ORDER BY 
        v."isBoosted" DESC,
        ${orderByClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Also get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "Venue" v
      ${whereClause}
    `;

    // Execute queries
    const venues: any[] = await prisma.$queryRawUnsafe(query);
    const countResult: any[] = await prisma.$queryRawUnsafe(countQuery);

    const total = Number(countResult[0]?.total || 0);

    // Transform results
    const transformedVenues = (venues as any[]).map((venue) => ({
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
      isBoosted: venue.isBoosted,
      trustScore: Number(venue.trustScore) || 50,
      galleryImages: venue.galleryImages || [],
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      distanceKm: venue.distance_meters ? Number(venue.distance_meters) / 1000 : null,
    }));

    return NextResponse.json({
      success: true,
      venues: transformedVenues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      searchParams: {
        lat,
        lng,
        radiusKm,
        category,
        musicGenres,
        vibes,
        facilities,
      },
    }, {
      headers: {
        // Edge caching headers
        "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_REVALIDATE}`,
        // Add performance timing header
        "X-Response-Time": `${Date.now() - (request as any).startTime || 0}ms`,
      },
    });
  } catch (error) {
    console.error("Venue search error:", error);
    return NextResponse.json(
      { error: "Failed to search venues" },
      { status: 500 }
    );
  }
}
