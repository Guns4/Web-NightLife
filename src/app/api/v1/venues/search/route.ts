/**
 * =====================================================
 * VENUE SEARCH API
 * AfterHoursID - Full-Text Search with GORM
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with Prisma/GORM in production
const venues = [
  { id: '1', name: 'Dragonfly', category: 'Nightclub', address: 'Jakarta', rating: 4.5, lat: -6.1751, lng: 106.8650 },
  { id: '2', name: 'Blue Oak', category: 'Bar', address: 'Jakarta', rating: 4.2, lat: -6.1760, lng: 106.8640 },
  { id: '3', name: 'The Vault', category: 'Speakeasy', address: 'Jakarta', rating: 4.8, lat: -6.1740, lng: 106.8630 },
  { id: '4', name: 'Rooftop Garden', category: 'Rooftop Bar', address: 'Jakarta', rating: 4.6, lat: -6.1770, lng: 106.8660 },
  { id: '5', name: 'Jazz Corner', category: 'Live Music', address: 'Jakarta', rating: 4.3, lat: -6.1780, lng: 106.8670 },
  { id: '6', name: 'Cocktail Lab', category: 'Cocktail Bar', address: 'Jakarta', rating: 4.7, lat: -6.1790, lng: 106.8680 },
];

// Search analytics storage (in-memory for demo)
const searchAnalytics: Array<{ query: string; timestamp: Date; results: number }> = [];

/**
 * Haversine distance calculation
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
 * GET /api/v1/venues/search
 * Full-Text Search with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const query = searchParams.get('query') || '';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const radius = parseInt(searchParams.get('radius') || '50', 10); // km
    
    // Parse categories filter
    const categories = category ? category.split(',').filter(Boolean) : [];
    
    // Build GORM-like query (in production, this would be actual GORM)
    let results = venues;
    
    // Full-Text Search using ILIKE
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      results = results.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.category.toLowerCase().includes(query.toLowerCase()) ||
        v.address.toLowerCase().includes(query.toLowerCase())
      );
      
      // Log search for analytics (only unique queries)
      const existingQuery = searchAnalytics.find(s => s.query === query.toLowerCase());
      if (!existingQuery) {
        searchAnalytics.push({
          query: query.toLowerCase(),
          timestamp: new Date(),
          results: results.length,
        });
        
        // Keep only last 1000 searches
        if (searchAnalytics.length > 1000) {
          searchAnalytics.shift();
        }
      }
    }
    
    // Category filter (multiple categories)
    if (categories.length > 0) {
      results = results.filter(v =>
        categories.some(cat => v.category.toLowerCase().includes(cat.toLowerCase()))
      );
    }
    
    // Calculate distance and filter by radius
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      results = results
        .map(v => ({
          ...v,
          distance: calculateDistance(userLat, userLng, v.lat, v.lng),
        }))
        .filter(v => v.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    }
    
    // Apply limit
    results = results.slice(0, limit);
    
    return NextResponse.json({
      venues: results,
      total: results.length,
      query,
      filters: {
        categories,
        radius,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/venues/search/analytics
 * Get trending search queries
 */
export async function POST(request: NextRequest) {
  try {
    // This would typically write to the database
    const body = await request.json();
    const { query, userId, filters } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Log search analytics
    searchAnalytics.push({
      query: query.toLowerCase(),
      timestamp: new Date(),
      results: 0, // Will be updated when search runs
    });
    
    return NextResponse.json({
      success: true,
      message: 'Search logged successfully',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to log search' },
      { status: 500 }
    );
  }
}
