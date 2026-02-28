/**
 * GPS Utilities for location-based verification
 * Part of the services/decoupling preparation
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verify if user is within acceptable distance of venue
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param venueLat Venue's latitude
 * @param venueLon Venue's longitude
 * @param thresholdMeters Maximum allowed distance (default 100m)
 * @returns Boolean indicating if user is within threshold
 */
export function isWithinVenueProximity(
  userLat: number,
  userLon: number,
  venueLat: number,
  venueLon: number,
  thresholdMeters: number = 100
): boolean {
  const distance = calculateDistance(userLat, userLon, venueLat, venueLon);
  return distance <= thresholdMeters;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
