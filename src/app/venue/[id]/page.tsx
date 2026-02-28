'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { sendWhatsAppBooking, generateSimpleWhatsAppLink, generateVenueWhatsAppLink, generateBookingWhatsAppLink } from '@/lib/utils/whatsapp';
import ReviewForm from '@/components/reviews/ReviewForm';
import SocialShareCard from '@/components/reviews/SocialShareCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extended category type
type VenueCategory = 'club' | 'bar' | 'karaoke' | 'ktv' | 'spa' | 'restaurant' | 'lounge' | 'rooftop' | 'beach_club';
type LiveVibeStatus = 'quiet' | 'crowded' | 'full';

interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  city: string;
  address: string | null;
  price_range: number | null;
  rating: number | null;
  features: string[] | null;
  images: string[] | null;
  is_active: boolean;
  opening_hours: Record<string, { open: string; close: string }> | null;
  whatsapp_number?: string;
  latitude?: number;
  longitude?: number;
}

interface VibeCheck {
  id: string;
  rating: number;
  comment: string | null;
  tag_vibe: string[] | null;
  created_at: string;
  is_verified_visit: boolean;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Promo {
  id: string;
  title: string;
  description: string | null;
  price_value: number | null;
  start_date: string;
  end_date: string;
  day_of_week: number[] | null;
}

const CATEGORIES: Record<VenueCategory, { label: string; icon: string; color: string }> = {
  club: { label: 'Club', icon: '🎵', color: 'bg-purple-500' },
  bar: { label: 'Bar', icon: '🍸', color: 'bg-amber-500' },
  karaoke: { label: 'Karaoke', icon: '🎤', color: 'bg-pink-500' },
  ktv: { label: 'KTV', icon: '🎤', color: 'bg-blue-500' },
  spa: { label: 'Spa', icon: '💆', color: 'bg-teal-500' },
  restaurant: { label: 'Restaurant', icon: '🍽️', color: 'bg-orange-500' },
  lounge: { label: 'Lounge', icon: '🛋️', color: 'bg-indigo-500' },
  rooftop: { label: 'Rooftop', icon: '🌆', color: 'bg-rose-500' },
  beach_club: { label: 'Beach Club', icon: '🏖️', color: 'bg-cyan-500' },
};

const FACILITY_ICONS: Record<string, string> = {
  'wifi': '📶',
  'parking': '🅿️',
  'vip': '👑',
  'outdoor': '🌳',
  'indoor': '🏠',
  'live music': '🎸',
  'dj': '🎧',
  'smoking': '🚬',
  'non-smoking': '🚭',
  'air conditioning': '❄️',
  'rooftop': '🌆',
  'pool': '🏊',
  'bar': '🍸',
  'restaurant': '🍽️',
  'spa': '💆',
  'karaoke': '🎤',
};

const DEFAULT_HOURS = {
  mon: { open: '18:00', close: '02:00' },
  tue: { open: '18:00', close: '02:00' },
  wed: { open: '18:00', close: '02:00' },
  thu: { open: '18:00', close: '02:00' },
  fri: { open: '18:00', close: '04:00' },
  sat: { open: '18:00', close: '04:00' },
  sun: { open: '18:00', close: '02:00' },
};

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [vibeChecks, setVibeChecks] = useState<VibeCheck[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [lastReviewData, setLastReviewData] = useState<{
    rating: number;
    comment: string;
    isVerified: boolean;
    isAIVerified: boolean;
  } | null>(null);
  
  // Booking form state
  const [guestName, setGuestName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [pax, setPax] = useState(2);

  useEffect(() => {
    fetchVenueData();
  }, [resolvedParams.id]);

  async function fetchVenueData() {
    setLoading(true);
    try {
      // Fetch venue
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (venueError) {
        console.error('Error fetching venue:', venueError);
        setVenue(null);
        return;
      }

      setVenue(venueData);

      // Fetch recent vibe checks (last 3)
      const { data: vibesData } = await supabase
        .from('vibe_checks')
        .select('*')
        .eq('venue_id', resolvedParams.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setVibeChecks(vibesData || []);

      // Fetch active promos
      const now = new Date().toISOString();
      const { data: promosData } = await supabase
        .from('promos')
        .select('*')
        .eq('venue_id', resolvedParams.id)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      setPromos(promosData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryInfo(category: string) {
    return CATEGORIES[category as VenueCategory] || { label: category, icon: '📍', color: 'bg-gray-500' };
  }

  function getPriceLabel(priceRange: number | null): string {
    if (!priceRange) return '$$';
    return '$'.repeat(priceRange);
  }

  function getFacilityIcon(facility: string): string {
    const lower = facility.toLowerCase();
    for (const [key, icon] of Object.entries(FACILITY_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return '✓';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleBookingWithDetails();
  }

  function handleSimpleBooking() {
    if (!venue) return;
    const url = generateVenueWhatsAppLink(venue.name, venue.whatsapp_number || '');
    window.open(url, '_blank');
  }

  function handleBookingWithDetails() {
    if (!venue) return;
    const url = generateBookingWhatsAppLink(
      venue.name,
      venue.whatsapp_number || '',
      guestName || 'Guest',
      bookingDate,
      pax
    );
    window.open(url, '_blank');
    setShowBookingModal(false);
  }

  const openingHours = venue?.opening_hours || DEFAULT_HOURS;

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-800" />
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/2" />
            <div className="h-4 bg-gray-800 rounded w-1/4" />
            <div className="h-32 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Venue Not Found</h1>
          <p className="text-gray-400 mb-6">The venue you're looking for doesn't exist.</p>
          <Link
            href="/discovery"
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            Browse Venues
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(venue.category);
  const images = venue.images && venue.images.length > 0 ? venue.images : [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-black text-white pb-24 lg:pb-12">
      {/* Hero Image Gallery */}
      <div className="relative h-64 md:h-96 bg-gray-900">
        {hasImages ? (
          <div className="relative h-full cursor-pointer" onClick={() => setShowGallery(true)}>
            <Image
              src={images[selectedImageIndex]}
              alt={venue.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-6xl">
            {categoryInfo.icon}
          </div>
        )}
        
        {/* Back Button */}
        <Link
          href="/discovery"
          className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Image Counter */}
        {hasImages && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {hasImages && images.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  idx === selectedImageIndex ? 'border-yellow-500' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`${venue.name} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Venue Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
                {venue.price_range && (
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs font-bold text-yellow-500">
                    {getPriceLabel(venue.price_range)}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{venue.name}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{venue.city}</span>
                </div>
                {venue.address && (
                  <span className="text-sm truncate max-w-[200px]">{venue.address}</span>
                )}
                {venue.rating && venue.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{venue.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {venue.description && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-3">About</h2>
                <p className="text-gray-300 leading-relaxed">{venue.description}</p>
              </div>
            )}

            {/* Facilities */}
            {venue.features && venue.features.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-3">Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 flex items-center gap-2 border border-gray-700"
                    >
                      <span>{getFacilityIcon(feature)}</span>
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Operational Hours */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Operational Hours</h2>
              <div className="space-y-2">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400">{DAY_NAMES[day]}</span>
                    <span className="text-white font-medium">
                      {hours.open} - {hours.close}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Vibes */}
            {vibeChecks.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-3">Recent Vibes</h2>
                <div className="space-y-4">
                  {vibeChecks.map((vibe) => (
                    <div key={vibe.id} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            {vibe.user?.avatar_url ? (
                              <Image
                                src={vibe.user.avatar_url}
                                alt={vibe.user.full_name || 'User'}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">
                                {vibe.user?.full_name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-white text-sm font-medium">
                            {vibe.user?.full_name || 'Anonymous'}
                          </span>
                          {vibe.is_verified_visit && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium"
                              title="User ini terverifikasi berada di lokasi saat memberikan ulasan."
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified Visit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < vibe.rating ? 'fill-current' : 'text-gray-600'}`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {vibe.comment && (
                        <p className="text-gray-400 text-sm">{vibe.comment}</p>
                      )}
                      {vibe.tag_vibe && vibe.tag_vibe.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {vibe.tag_vibe.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-gray-600 text-xs mt-2">
                        {formatDate(vibe.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Form with GPS Verification */}
            {venue && venue.latitude && venue.longitude && (
              <ReviewForm 
                venueId={venue.id} 
                venueLat={venue.latitude} 
                venueLon={venue.longitude}
                onReviewSubmitted={(reviewData) => {
                  fetchVenueData();
                  // Store review data and show share card
                  if (reviewData) {
                    setLastReviewData(reviewData);
                  }
                  setShowShareCard(true);
                }}
              />
            )}

            {/* Social Share Card - Show after review submission */}
            {showShareCard && venue && (
              <SocialShareCard
                venueName={venue.name}
                venueAddress={venue.address || venue.city}
                rating={lastReviewData?.rating || 5}
                comment={lastReviewData?.comment}
                userName="You"
                isVerified={lastReviewData?.isVerified || false}
                isAIVerified={lastReviewData?.isAIVerified || false}
              />
            )}
          </div>

          {/* Right Column - Promos & Booking */}
          <div className="space-y-6">
            {/* Active Promos */}
            {promos.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-6 border border-yellow-500/30">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🔥</span> Flash Deals
                </h2>
                <div className="space-y-4">
                  {promos.map((promo) => (
                    <div key={promo.id} className="bg-black/40 rounded-lg p-4 border border-yellow-500/20">
                      <h3 className="font-semibold text-white mb-1">{promo.title}</h3>
                      {promo.description && (
                        <p className="text-gray-400 text-sm mb-2">{promo.description}</p>
                      )}
                      {promo.price_value && (
                        <div className="text-2xl font-bold text-yellow-500">
                          Rp {promo.price_value.toLocaleString('id-ID')}
                        </div>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        Valid until {formatDate(promo.end_date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Card */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Book a Table</h2>
              <p className="text-gray-400 text-sm mb-4">
                Reserve your spot directly via WhatsApp. Our team will confirm your booking instantly.
              </p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors min-h-[48px]"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Book via WhatsApp
              </button>
              <p className="text-gray-500 text-xs text-center mt-3">
                Instant confirmation • No booking fee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating VVIP Button (Mobile) */}
      <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
        <button
          onClick={() => setShowBookingModal(true)}
          className="w-full py-4 bg-black border-2 border-[#C5A06F] text-[#C5A06F] rounded-xl font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,160,111,0.2)] hover:scale-105 active:scale-95 transition-all min-h-[48px] animate-pulse"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Booking via WA
        </button>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-[#C5A06F] p-6 w-full max-w-md shadow-[0_0_30px_rgba(197,160,111,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Book Your Table</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Venue</label>
                <div className="bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white">
                  {venue.name}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Your Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#C5A06F] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#C5A06F] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Number of Guests</label>
                <select
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#C5A06F] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Person' : 'Persons'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors min-h-[48px] mt-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Booking Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGallery && hasImages && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowGallery(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:text-yellow-500 transition-colors"
            onClick={() => setShowGallery(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            className="absolute left-4 p-2 text-white hover:text-yellow-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
            }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 p-2 text-white hover:text-yellow-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((selectedImageIndex + 1) % images.length);
            }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] p-4">
            <Image
              src={images[selectedImageIndex]}
              alt={venue.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
