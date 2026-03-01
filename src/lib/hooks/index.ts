/**
 * =====================================================
 * HOOKS INDEX
 * Central export for all custom hooks
 * =====================================================
 */

// Auth hooks - use useAuthStore from store
export { useAuthStore } from "@/lib/auth/store";

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

// SWR hooks - using available exports
export { useVenueSearch, useVenueDetail, useAutoRefresh } from "@/lib/hooks/useSWR";

// Socket hooks
export { useSocket, SocketProvider } from "@/lib/hooks/useSocket";
