/**
 * =====================================================
 * CORE TYPE DEFINITIONS
 * AfterHoursID - Zero-Defect Type Safety
 * =====================================================
 */

// =====================================================
// USER TYPES
// =====================================================

export type UserRole = 
  | 'GUEST' 
  | 'USER' 
  | 'VENUE_MANAGER' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  city?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  xp_points: number;
  level: number;
  streak_days: number;
  badges: Badge[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications_enabled: boolean;
  email_notifications: boolean;
  preferred_categories: string[];
  preferred_price_range: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

// =====================================================
// VENUE TYPES
// =====================================================

export type VenueCategory = 
  | 'club' 
  | 'bar' 
  | 'lounge' 
  | 'restaurant' 
  | 'cafe';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: VenueCategory;
  city: string;
  district?: string;
  address: string;
  location: GeoPoint;
  price_range: PriceRange;
  rating: number;
  review_count: number;
  images: VenueImage[];
  amenities: string[];
  opening_hours: OpeningHours;
  contact: VenueContact;
  status: 'active' | 'pending' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VenueImage {
  id: string;
  url: string;
  alt?: string;
  is_primary: boolean;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface VenueContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
}

// =====================================================
// PROMO TYPES
// =====================================================

export type PromoCategory = 
  | 'vip_access' 
  | 'drinks' 
  | 'ladies_night' 
  | 'happy_hour' 
  | 'food' 
  | 'event';

export type PromoStatus = 'draft' | 'active' | 'expired' | 'cancelled';

export interface Promo {
  id: string;
  title: string;
  description: string;
  venue_id: string;
  venue?: Venue;
  category: PromoCategory;
  discount_percentage: number;
  original_price: number;
  discounted_price: number;
  currency: string;
  valid_from: string;
  valid_until: string;
  status: PromoStatus;
  is_featured: boolean;
  is_vip: boolean;
  max_redeem?: number;
  redeemed_count: number;
  image_url?: string;
  terms?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// RESERVATION TYPES
// =====================================================

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'completed' 
  | 'no_show';

export interface Reservation {
  id: string;
  user_id: string;
  venue_id: string;
  venue?: Venue;
  promo_id?: string;
  promo?: Promo;
  date: string;
  time: string;
  party_size: number;
  status: ReservationStatus;
  total_price: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// REVIEW TYPES
// =====================================================

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface Review {
  id: string;
  user_id: string;
  user?: User;
  venue_id: string;
  venue?: Venue;
  rating: ReviewRating;
  title?: string;
  content: string;
  images?: string[];
  gps_coordinates?: GeoPoint;
  status: ReviewStatus;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export type NotificationType = 
  | 'promo' 
  | 'reservation' 
  | 'review' 
  | 'system' 
  | 'achievement';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

export type PaymentMethod = 
  | 'midtrans' 
  | 'xendit' 
  | 'wallet' 
  | 'crypto';

export interface Payment {
  id: string;
  user_id: string;
  reservation_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// GAMIFICATION TYPES
// =====================================================

export interface XPGain {
  source: string;
  amount: number;
  description: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp_required: number;
  xp_current: number;
  xp_next_level: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user?: User;
  rank: number;
  xp_points: number;
  streak_days: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =====================================================
// FORM TYPES
// =====================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: { value: string; label: string }[];
}

export interface FormError {
  field: string;
  message: string;
}

// =====================================================
// UI COMPONENT TYPES
// =====================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface CardProps {
  variant: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
