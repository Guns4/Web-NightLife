/**
 * =====================================================
 * GPS LOCATION HOOK
 * Real-time location with anti-spoofing
 * =====================================================
 */

import { useState, useEffect, useCallback } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

interface UseGPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  // Anti-spoofing thresholds
  minAccuracy?: number; // meters - reject if worse than this
  maxAccuracy?: number; // meters - reject if worse than this
  detectStaticCoordinates?: boolean;
}

const DEFAULT_OPTIONS: UseGPSOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // 1 minute
  minAccuracy: 10, // Need at least 10m accuracy
  maxAccuracy: 5000, // Reject if worse than 5km
  detectStaticCoordinates: true,
};

/**
 * Detect if coordinates appear to be spoofed (static/fake)
 * Checks for:
 * - Perfect round numbers (common in emulators)
 * - Known test coordinates
 * - Zero coordinates when not expected
 */
function detectSpoofedCoordinates(lat: number, lng: number): boolean {
  // Check for perfect round numbers (emulator indicator)
  if (lat % 1 === 0 && lng % 1 === 0) {
    return true;
  }

  // Check for zero coordinates (unless at origin)
  if (lat === 0 && lng === 0) {
    return true;
  }

  // Check for common emulator/test coordinates
  const testCoordinates = [
    [-6.1751, 106.8650], // Jakarta (common test)
    [0, 0],
    [1.0, 1.0],
  ];

  for (const [testLat, testLng] of testCoordinates) {
    if (Math.abs(lat - testLat) < 0.001 && Math.abs(lng - testLng) < 0.001) {
      return true;
    }
  }

  // Check for coordinates outside Indonesia bounds
  if (lat < -11 || lat > 6 || lng < 95 || lng > 141) {
    return true;
  }

  return false;
}

/**
 * Hook to get user's GPS location with anti-spoofing
 */
export function useGPS(options: UseGPSOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });

  const [coordinateHistory, setCoordinateHistory] = useState<Array<{lat: number; lng: number; time: number}>>([]);

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        isLoading: false,
      }));
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: config.enableHighAccuracy,
            timeout: config.timeout,
            maximumAge: config.maximumAge,
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Anti-spoofing checks
      if (config.detectStaticCoordinates && detectSpoofedCoordinates(latitude, longitude)) {
        setLocation(prev => ({
          ...prev,
          error: "Invalid location detected. Please disable location spoofing.",
          isLoading: false,
        }));
        return;
      }

      // Accuracy check
      if (accuracy && accuracy > config.maxAccuracy!) {
        setLocation(prev => ({
          ...prev,
          error: `Location accuracy too low (${accuracy.toFixed(0)}m). Please try again.`,
          isLoading: false,
        }));
        return;
      }

      // Update coordinate history for movement detection
      const now = Date.now();
      setCoordinateHistory(prev => {
        const newHistory = [...prev, { lat: latitude, lng: longitude, time: now }];
        // Keep only last 10 readings
        return newHistory.slice(-10);
      });

      setLocation({
        latitude,
        longitude,
        accuracy,
        error: null,
        isLoading: false,
      });
    } catch (error: any) {
      let errorMessage = "Failed to get location";
      
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = "Location permission denied. Please enable GPS.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage = "Location unavailable. Please try again.";
      } else if (error.code === error.TIMEOUT) {
        errorMessage = "Location request timed out. Please try again.";
      }

      setLocation(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [config]);

  // Request location on mount
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Check for static coordinates (not moving)
  const isStatic = coordinateHistory.length >= 5 && 
    coordinateHistory.every((c, i) => {
      if (i === 0) return false;
      const prev = coordinateHistory[i - 1];
      return Math.abs(c.lat - prev.lat) < 0.0001 && Math.abs(c.lng - prev.lng) < 0.0001;
    });

  return {
    ...location,
    isStatic,
    refresh: getLocation,
    // Formatted for API calls
    apiParams: location.latitude && location.longitude 
      ? { lat: location.latitude, lng: location.longitude }
      : null,
  };
}

/**
 * Hook to calculate distance from user to a venue
 */
export function useDistanceToVenue(
  venueLat: number | null,
  venueLng: number | null
) {
  const userLocation = useGPS();

  const distanceKm = (() => {
    if (!userLocation.latitude || !userLocation.longitude || !venueLat || !venueLng) {
      return null;
    }

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = toRad(venueLat - userLocation.latitude);
    const dLng = toRad(venueLng - userLocation.longitude);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.latitude)) * Math.cos(toRad(venueLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  })();

  return {
    distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : null,
    ...userLocation,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
