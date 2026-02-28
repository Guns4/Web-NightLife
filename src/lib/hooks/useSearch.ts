/**
 * =====================================================
 * SEARCH HOOKS & UTILITIES
 * AfterHoursID - High-Performance Search
 * =====================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// =====================================================
// USE DEBOUNCE HOOK
// =====================================================

/**
 * Debounce hook - delays value updates by specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce callback hook - for debouncing function calls
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// =====================================================
// GEOLOCATION HOOK
// =====================================================

interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Geolocation hook with error handling
 */
export function useGeolocation(options: UseGeolocationOptions = {}): GeoLocationState {
  const [state, setState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
  } = options;

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Unknown error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return state;
}

// =====================================================
// SEARCH STATE MANAGEMENT
// =====================================================

export interface SearchFilters {
  query: string;
  location: string;
  categories: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  priceRange?: [number, number];
  openNow?: boolean;
  sortBy?: 'distance' | 'rating' | 'popularity';
}

interface UseSearchStateReturn {
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search state management hook
 */
export function useSearchState(initialFilters?: Partial<SearchFilters>): UseSearchStateReturn {
  const [filters, setFiltersState] = useState<SearchFilters>({
    query: '',
    location: '',
    categories: [],
    radius: 10,
    sortBy: 'distance',
    ...initialFilters,
  });

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      query: '',
      location: '',
      categories: [],
      radius: 10,
      sortBy: 'distance',
    });
  }, []);

  const hasActiveFilters = 
    filters.query.length > 0 ||
    filters.location.length > 0 ||
    filters.categories.length > 0 ||
    filters.openNow === true;

  return {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
}

// =====================================================
// LOCAL STORAGE HOOK
// =====================================================

/**
 * Persist search history to localStorage
 */
export function useSearchHistory(maxItems: number = 10) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('search_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, maxItems);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('search_history');
  }, []);

  return { history, addToHistory, clearHistory };
}

// =====================================================
// DISTANCE CALCULATION
// =====================================================

/**
 * Calculate distance between two coordinates using Haversine formula
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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm}km away`;
}
