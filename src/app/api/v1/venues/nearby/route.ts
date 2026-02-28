/**
 * =====================================================
 * NEARBY VENUES API - POSTGIS SPATIAL QUERIES
 * AfterHoursID - High-Performance Geospatial
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock venues data (replace with Prisma/PostGIS in production)
const venues = [
  { id: '1', name: 'Dragonfly', category: 'Nightclub', address: 'Jakarta', rating: 4.5, lat: -6.1751, lng: 106.8650, priceLevel: 3 },
  { id: '2', name: 'Blue Oak', category: 'Bar', address: 'Jakarta', rating: 4.2, lat: -6.1760, lng: 106.8640, priceLevel: 2 },
  { id: '3', name: 'The Vault', category: 'Speakeasy', address: 'Jakarta', rating: 4.8, lat: -6.1740, lng: 106.8630, priceLevel: 4 },
  { id: '4', name: 'Rooftop Garden', category: 'Rooftop Bar', address: 'Jakarta', rating: 4.6, lat: -6.1770, lng: 106.8660, priceLevel: 3 },
  { id: '5', name: 'Jazz Corner', category: 'Live Music', address: 'Jakarta', rating: 4.3, lat: -6.1780, lng: 106.8670, priceLevel: 2 },
  { id: '6', name: 'Cocktail Lab', category: 'Cocktail Bar', address: 'Jakarta', rating: 4.7, lat: -6.1790, lng: 106.8680, priceLevel: 3 },
];

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if point is within bounding box
 */
function isWithinBounds(lat: number, lng: number, bounds: { north: number; south: number; east: number; west: number }): boolean {
  return lat <= bounds.north && lat >= bounds.south &&
         ((lng >= bounds.west && lng <= bounds.east) ||
          (bounds.east < bounds.west && (lng >= bounds.west || lng <= bounds.east)));
}

/**
 * GET /api/v1/venues/nearby
 * PostGIS-style spatial query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Center coordinates
    const lat = parseFloat(searchParams.get('lat') || '-6.1751');
    const lng = parseFloat(searchParams.get('lng') || '106.8650');
    
    // Radius in kilometers (default 10km)
    const radius = parseFloat(searchParams.get('radius') || '10');
    
    // Bounding box (for map viewport search)
    const north = parseFloat(searchParams.get('north') || '');
    const south = parseFloat(searchParams.get('south') || '');
    const east = parseFloat(searchParams.get('east') || '');
    const west = parseFloat(searchParams.get('west') || '');
    
    // Category filter
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    
    // Limit results
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Sort by
    const sortBy = searchParams.get('sortBy') || 'distance';
    
    // Filter venues
    let results = venues;
    
    // If bounding box provided, use it (PostGIS ST_DWithin simulation)
    if (!isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west)) {
      const bounds = { north, south, east, west };
      results = results.filter(v => isWithinBounds(v.lat, v.lng, bounds));
    } else {
      // Otherwise use radius (PostGIS ST_DWithin with ST_DistanceSphere simulation)
      results = results.map(v => ({
        ...v,
        distance: calculateDistance(lat, lng, v.lat, v.lng),
      })).filter(v => v.distance <= radius);
    }
    
    // Apply category filter
    if (categories.length > 0) {
      results = results.filter(v => 
        categories.some(cat => v.category.toLowerCase().includes(cat.toLowerCase()))
      );
    }
    
    // Sort results
    if (sortBy === 'distance') {
      results = results.map(v => ({
        ...v,
        distance: calculateDistance(lat, lng, v.lat, v.lng),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'rating') {
      results = results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'popularity') {
      // In production, would sort by view count
      results = results.sort((a, b) => b.rating - a.rating);
    }
    
    // Apply limit
    results = results.slice(0, limit);
    
    // Add distance to each result
    const resultsWithDistance = results.map(v => ({
      ...v,
      distance: calculateDistance(lat, lng, v.lat, v.lng),
    }));
    
    return NextResponse.json({
      venues: resultsWithDistance,
      total: resultsWithDistance.length,
      center: { lat, lng },
      radius,
      bounds: !isNaN(north) ? { north, south, east, west } : null,
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// =====================================================
// POSTGIS QUERY EXAMPLES (for reference)
// =====================================================

/*
-- These are the actual PostGIS queries that would be used in production:

-- ST_DWithin: Find venues within 5km radius
SELECT id, name, category, lat, lng,
  ST_DistanceSphere(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)
  ) as distance_km
FROM venues
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
  ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography,
  5000 -- 5km in meters
)
ORDER BY distance_km
LIMIT :limit;

-- Bounding box query (for map viewport)
SELECT id, name, category, lat, lng
FROM venues
WHERE lat BETWEEN :south AND :north
  AND lng BETWEEN :west AND :east;

-- Create spatial index for fast queries
CREATE INDEX venues_location_idx ON venues USING GIST (ST_MakePoint(lng, lat));
*/
