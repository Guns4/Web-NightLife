/**
 * =====================================================
 * HOOKS INDEX
 * Central export for all custom hooks
 * =====================================================
 */

// Auth hooks
export { useAuth, useAuthStore } from "@/lib/auth/store";

// GPS hooks
export { useGPS, useDistanceToVenue } from "@/lib/hooks/useGPS";

// Scroll animation hooks
export {
  useScrollAnimation,
  useParallax,
  useScrollProgress,
  useScrollTrigger,
  fadeInUp,
  fadeInDown,
  scaleIn,
  staggerContainer,
  slideInLeft,
  slideInRight,
} from "@/lib/hooks/useScrollAnimation";

// SWR hooks
export { useVenues, useVenue, useNearbyVenues } from "@/lib/hooks/useSWR";
