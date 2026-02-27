/**
 * Database Types for NightLife Indonesia
 * Generated from Supabase Schema
 */

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'guest' | 'owner' | 'admin';

export type VenueCategory = 'club' | 'karaoke' | 'ktv' | 'spa';

export type LiveVibeStatus = 'quiet' | 'crowded' | 'full';

export type Atmosphere = 'executive' | 'funky' | 'chill' | 'high-energy' | 'rnb-only' | 'live-music';

export const ATMOSPHERE_OPTIONS: { value: Atmosphere; label: string }[] = [
  { value: 'executive', label: 'Executive' },
  { value: 'funky', label: 'Funky' },
  { value: 'chill', label: 'Chill' },
  { value: 'high-energy', label: 'High-Energy' },
  { value: 'rnb-only', label: 'RnB Only' },
  { value: 'live-music', label: 'Live Music' },
];

// ============================================================
// TABLES
// ============================================================

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  owner_id: string | null;
  name: string;
  category: VenueCategory;
  description: string | null;
  city: string;
  address: string | null;
  coordinates: unknown | null;
  price_range: number | null;
  rating: number | null;
  features: string[] | null;
  images: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  slug: string | null;
  price_metadata: PriceMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface Promo {
  id: string;
  venue_id: string | null;
  title: string;
  description: string | null;
  price_value: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  day_of_week: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface VibeCheck {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  rating: number;
  comment: string | null;
  tag_vibe: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LiveVibe {
  id: string;
  venue_id: string | null;
  status: LiveVibeStatus;
  music_genre: string | null;
  updated_at: string;
}

export interface SavedFavorite {
  id: string;
  user_id: string | null;
  venue_id: string | null;
  created_at: string;
}

// ============================================================
// SHARED INTERFACES
// ============================================================

export interface VenueWithRelations extends Venue {
  owner?: Profile | null;
  promos?: Promo[];
  vibe_checks?: VibeCheck[];
  live_vibe?: LiveVibe | null;
  average_rating?: number;
  distance_km?: number;
}

export interface PromoWithVenue extends Promo {
  venue?: Venue;
}

export interface VibeCheckWithUser extends VibeCheck {
  user?: Profile;
}

export interface VenueFilters {
  query?: string;
  category?: VenueCategory;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  features?: string[];
  atmosphere?: Atmosphere[];
  verifiedOnly?: boolean;
}

export interface PriceMetadata {
  minimumCharge?: number;
  sofaReservation?: number;
  coverCharge?: number;
  vipPackage?: number;
}

// ============================================================
// HELPERS
// ============================================================

export function getPriceRangeDisplay(priceRange: number | null): string {
  if (!priceRange) return '$$';
  return '$'.repeat(priceRange);
}

export function getCategoryLabel(category: VenueCategory): string {
  const labels: Record<VenueCategory, string> = {
    club: 'Club',
    karaoke: 'Karaoke',
    ktv: 'KTV',
    spa: 'Spa',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: VenueCategory): string {
  const colors: Record<VenueCategory, string> = {
    club: 'bg-purple-500',
    karaoke: 'bg-pink-500',
    ktv: 'bg-blue-500',
    spa: 'bg-teal-500',
  };
  return colors[category] || 'bg-gray-500';
}

export function getLiveStatusColor(status: LiveVibeStatus): string {
  const colors: Record<LiveVibeStatus, string> = {
    quiet: 'bg-green-500',
    crowded: 'bg-yellow-500',
    full: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getLiveStatusLabel(status: LiveVibeStatus): string {
  const labels: Record<LiveVibeStatus, string> = {
    quiet: 'Quiet',
    crowded: 'Crowded',
    full: 'Full',
  };
  return labels[status] || status;
}
