/**
 * =====================================================
 * SWR HOOKS - DATA FETCHING
 * Stale-While-Revalidate for consistent data
 * =====================================================
 */

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * SWR hook for venue search
 */
export function useVenueSearch(params: {
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: string;
  music_genres?: string;
  vibes?: string;
  facilities?: string;
  page?: number;
  limit?: number;
}) {
  // Build query string
  const queryParams = new URLSearchParams();
  if (params.lat) queryParams.set("lat", params.lat.toString());
  if (params.lng) queryParams.set("lng", params.lng.toString());
  if (params.radius_km) queryParams.set("radius_km", params.radius_km.toString());
  if (params.category) queryParams.set("category", params.category);
  if (params.music_genres) queryParams.set("music_genres", params.music_genres);
  if (params.vibes) queryParams.set("vibes", params.vibes);
  if (params.facilities) queryParams.set("facilities", params.facilities);
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/api/venues/search?${queryString}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      fallbackData: null,
    }
  );

  return {
    venues: data?.venues || [],
    pagination: data?.pagination || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * SWR hook for venue detail
 */
export function useVenueDetail(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `/api/venues/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds
    }
  );

  return {
    venue: data?.venue || null,
    reviews: data?.reviews || null,
    promos: data?.promos || null,
    stats: data?.stats || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * SWR hook for auto-refresh data
 * Useful for real-time features like live vibe status
 */
export function useAutoRefresh<T>(
  key: string | null,
  intervalMs: number = 30000
) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    fetcher,
    {
      refreshInterval: intervalMs,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
