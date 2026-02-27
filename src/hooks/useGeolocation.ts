"use client";

import { create } from "zustand";
import { createContext, useContext, ReactNode } from "react";

/**
 * Location state interface
 */
interface LocationState {
  latitude: number | null;
  longitude: number | null;
  areaName: string | null;
  city: string | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
}

/**
 * Location store actions
 */
interface LocationActions {
  setLocation: (lat: number, lng: number) => void;
  setAreaName: (area: string, city: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPermissionStatus: (status: "granted" | "denied" | "prompt" | "unknown") => void;
  reset: () => void;
}

/**
 * Combined location store type
 */
type LocationStore = LocationState & LocationActions;

/**
 * Initial state
 */
const initialState: LocationState = {
  latitude: null,
  longitude: null,
  areaName: null,
  city: null,
  isLoading: false,
  error: null,
  permissionStatus: "unknown",
};

/**
 * Create Zustand store for location
 */
export const useLocationStore = create<LocationStore>((set) => ({
  ...initialState,
  
  setLocation: (lat, lng) => set({ 
    latitude: lat, 
    longitude: lng, 
    error: null 
  }),
  
  setAreaName: (area, city) => set({ 
    areaName: area, 
    city 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  
  reset: () => set(initialState),
}));

/**
 * Geolocation hook with permission handling and edge cases
 */
export function useGeolocation() {
  const store = useLocationStore();
  
  const requestLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      store.setError("Geolocation is not supported by your browser");
      return;
    }

    store.setLoading(true);
    store.setPermissionStatus("prompt");

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          store.setLocation(latitude, longitude);
          store.setPermissionStatus("granted");
          store.setLoading(false);
          
          // Reverse geocode to get area name
          await reverseGeocode(latitude, longitude);
          
          resolve();
        },
        (error) => {
          let errorMessage = "Unable to get location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied";
              store.setPermissionStatus("denied");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          store.setError(errorMessage);
          store.setLoading(false);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  };

  /**
   * Reverse geocoding - converts coordinates to area name
   * Uses OpenStreetMap Nominatim API (free, no API key required)
   */
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "NightLife Indonesia/1.0",
          },
        }
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();
      
      const areaName = data.address?.suburb || 
                       data.address?.neighbourhood || 
                       data.address?.city_district || 
                       "Unknown Area";
                       
      const city = data.address?.city || 
                   data.address?.municipality || 
                   "Unknown City";
                   
      store.setAreaName(areaName, city);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Fallback - try to infer from coordinates
      inferAreaFromCoords(lat, lng);
    }
  };

  /**
   * Fallback: Infer area from coordinates (Jakarta-specific)
   */
  const inferAreaFromCoords = (lat: number, lng: number) => {
    // Jakarta bounds
    if (lat >= -6.4 && lat <= -6.1 && lng >= 106.6 && lng <= 107.0) {
      if (lng < 106.8) {
        store.setAreaName("Jakarta Barat", "Jakarta");
      } else if (lng < 106.85) {
        store.setAreaName("Jakarta Pusat", "Jakarta");
      } else if (lng < 106.95) {
        store.setAreaName("Jakarta Selatan", "Jakarta");
      } else {
        store.setAreaName("Jakarta Timur", "Jakarta");
      }
    } else {
      store.setAreaName("Unknown Area", "Unknown City");
    }
  };

  /**
   * Watch position (for real-time tracking)
   */
  const watchPosition = () => {
    if (!navigator.geolocation) {
      store.setError("Geolocation is not supported");
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        store.setLocation(position.coords.latitude, position.coords.longitude);
        store.setPermissionStatus("granted");
      },
      (error) => {
        store.setError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return watchId;
  };

  /**
   * Clear watch position
   */
  const clearWatch = (watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  };

  return {
    ...store,
    requestLocation,
    watchPosition,
    clearWatch,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
