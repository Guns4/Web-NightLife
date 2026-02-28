"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, Star, Sparkles, Heart, CheckCircle, ShieldCheck, Navigation 
} from "lucide-react";

/**
 * Types for VenueCard
 */
interface Venue {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  category: string;
  images?: string[] | null;
  is_verified?: boolean;
  rating?: number | null;
  price_range?: string | null;
  features?: string[] | null;
  musicGenres?: string[] | null;
  vibes?: string[] | null;
  trustScore?: number;
}

interface Promo {
  id: string;
  title: string;
  price_value?: number | null;
}

interface LiveVibe {
  status: "quiet" | "busy" | "packed" | "moderate";
}

interface VenueCardProps {
  venue: Venue;
  promo?: Promo | null;
  liveVibe?: LiveVibe | null;
  distanceKm?: number | null;
  isFavorite?: boolean;
  onFavoriteToggle?: (venueId: string) => void;
}

/**
 * Get price range display
 */
function getPriceRangeDisplay(priceRange?: string | null): string {
  if (!priceRange) return "Price TBD";
  switch (priceRange) {
    case "low": return "Rp 50K-150K";
    case "medium": return "Rp 150K-350K";
    case "high": return "Rp 350K-750K";
    case "ultra": return "Rp 750K+";
    default: return priceRange;
  }
}

/**
 * Get category label
 */
function getCategoryLabel(category?: string): string {
  if (!category) return "Venue";
  const labels: Record<string, string> = {
    nightclub: "Nightclub",
    bar: "Bar",
    lounge: "Lounge",
    karaoke: "Karaoke",
    ktv: "KTV",
    spa: "Spa",
    club: "Club",
  };
  return labels[category.toLowerCase()] || category;
}

/**
 * Get live status color
 */
function getLiveStatusColor(status?: string): string {
  switch (status) {
    case "packed": return "bg-red-500";
    case "busy": return "bg-orange-500";
    case "moderate": return "bg-yellow-500";
    case "quiet": return "bg-green-500";
    default: return "bg-green-500";
  }
}

/**
 * Get live status label
 */
function getLiveStatusLabel(status?: string): string {
  switch (status) {
    case "packed": return "Packed";
    case "busy": return "Busy";
    case "moderate": return "Moderate";
    case "quiet": return "Quiet";
    default: return "Unknown";
  }
}

/**
 * Cyberpunk VenueCard Component
 * Gold Neon styling with glassmorphism
 */
export default function VenueCard({ 
  venue, 
  promo, 
  liveVibe,
  distanceKm,
  isFavorite = false,
  onFavoriteToggle,
}: VenueCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [imageLoaded, setImageLoaded] = useState(false);

  const priceDisplay = getPriceRangeDisplay(venue.price_range);
  const categoryLabel = getCategoryLabel(venue.category);
  const imageUrl = venue.images && venue.images.length > 0 
    ? venue.images[0] 
    : "/images/placeholder-venue.jpg";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(venue.id);
  };

  return (
    <Link href={venue.slug ? `/venue/${venue.slug}` : `#`} onClick={venue.slug ? undefined : (e) => e.preventDefault()}>
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="group relative bg-black/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-[#FFD700]/30 cursor-pointer hover:border-[#FFD700] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-all duration-300"
        style={{ aspectRatio: '4 / 5' }}
      >
        {/* Image Container */}
        <div className="relative h-[55%] overflow-hidden">
          {/* Blur placeholder */}
          <div className={`absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'} z-0`} />
          
          {/* Image */}
          <Image
            src={imageUrl}
            alt={venue.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-110 z-10 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-20" />

          {/* Top Badges Row */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
            {/* Category + Verified Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-semibold bg-black/50 backdrop-blur-md rounded-full text-white border border-[#FFD700]/20 tracking-wide">
                {categoryLabel}
              </span>
              {venue.is_verified && (
                <span className="px-2 py-1 text-xs font-medium bg-[#FFD700]/20 backdrop-blur-md rounded-full text-[#FFD700] flex items-center gap-1 border border-[#FFD700]/30">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            {/* Favorite Toggle with Animation */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleFavoriteClick}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-[#FFD700]/20 hover:bg-black/60 transition-colors"
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${favorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Live Status Badge */}
          {liveVibe && liveVibe.status !== 'quiet' && (
            <div className="absolute top-[4.5rem] right-3 z-30">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-[#FFD700]/20">
                <span className={`w-2 h-2 rounded-full ${getLiveStatusColor(liveVibe.status)} animate-pulse`} />
                <span className="text-xs font-medium text-white">
                  {getLiveStatusLabel(liveVibe.status)}
                </span>
              </div>
            </div>
          )}

          {/* Promo Overlay with Shimmer */}
          <AnimatePresence>
            {promo && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-3 left-3 right-3 z-30"
              >
                <div className="relative px-4 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] rounded-xl overflow-hidden shadow-lg">
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 3 
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black tracking-wide">
                        PROMO
                      </span>
                    </div>
                    {promo.price_value && (
                      <span className="text-lg font-bold text-black">
                        Rp{Math.round(promo.price_value).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="h-[45%] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title */}
            <h3 className="font-syne font-bold text-lg text-white leading-tight line-clamp-1 group-hover:text-[#FFD700] transition-colors tracking-[-0.03em]">
              {venue.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-white/50">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">
                {venue.city}
                {venue.address && ` • ${venue.address}`}
              </span>
            </div>

            {/* Tags */}
            {(venue.musicGenres || venue.vibes) && (
              <div className="flex flex-wrap gap-1">
                {venue.musicGenres?.slice(0, 2).map((genre, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-full text-[#FFD700]">
                    {genre}
                  </span>
                ))}
                {venue.vibes?.slice(0, 2).map((vibe, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                    {vibe}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div className="flex items-end justify-between pt-2">
            {/* Trust Score & Distance */}
            <div className="flex items-center gap-3">
              {/* Trust Score Badge */}
              {venue.trustScore !== undefined && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span className="text-xs font-bold text-[#FFD700]">
                    {venue.trustScore.toFixed(0)}%
                  </span>
                </div>
              )}
              {/* Distance Badge */}
              {distanceKm !== undefined && distanceKm !== null && (
                <div className="flex items-center gap-1 text-white/50">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {distanceKm.toFixed(1)} km
                  </span>
                </div>
              )}
            </div>

            {/* Price & Rating */}
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-white tracking-wide">
                {priceDisplay}
              </span>
              {venue.rating && venue.rating > 0 && (
                <div className="hidden md:flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-white/80">
                    {venue.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover Border Glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#FFD700]/50" />
        </div>
      </motion.article>
    </Link>
  );
}
