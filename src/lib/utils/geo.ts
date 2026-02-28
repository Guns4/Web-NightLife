/**
 * Menghitung jarak antara dua koordinat dalam meter menggunakan Haversine Formula.
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Jari-jari Bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Hasil dalam meter
  return distance;
}

/**
 * Validasi apakah tamu berada dalam radius yang ditentukan (misal 100 meter)
 */
export function isWithinVenueRadius(
  userLat: number, 
  userLon: number, 
  venueLat: number, 
  venueLon: number, 
  radiusInMeters: number = 100
): boolean {
  const distance = calculateDistance(userLat, userLon, venueLat, venueLon);
  return distance <= radiusInMeters;
}
