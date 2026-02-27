"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Star, Sparkles, Heart, CheckCircle } from "lucide-react";
import { 
  Venue, 
  Promo, 
  LiveVibe, 
  getPriceRangeDisplay, 
  getCategoryLabel,
  getLiveStatusColor,
  getLiveStatusLabel
} from "@/lib/database/types";

/**
 * VenueCard Props
 */
interface VenueCardProps {
  venue: Venue;
  promo?: Promo | null;
  liveVibe?: LiveVibe | null;
  isFavorite?: boolean;
  onFavoriteToggle?: (venueId: string) => void;
  onClick?: () => void;
}

/**
 * Premium VenueCard Component
 * Glassmorphism dark-theme with 4:5 aspect ratio, live status, promo overlay
 */
export default function VenueCard({ 
  venue, 
  promo, 
  liveVibe,
  isFavorite = false,
  onFavoriteToggle,
  onClick 
}: VenueCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [imageLoaded, setImageLoaded] = useState(false);

  const priceDisplay = getPriceRangeDisplay(venue.price_range);
  const categoryLabel = getCategoryLabel(venue.category);
  const imageUrl = venue.images && venue.images.length > 0 
    ? venue.images[0] 
    : "/images/placeholder-venue.jpg";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(venue.id);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-[#C026D3]/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(192,38,211,0.2)]"
      style={{ aspectRatio: '4 / 5' }}
    >
      {/* Image Container */}
      <div className="relative h-[55%] overflow-hidden">
        {/* Blur placeholder */}
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'} z-0`} />
        
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
            <span className="px-3 py-1.5 text-xs font-semibold bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 tracking-wide">
              {categoryLabel}
            </span>
            {venue.is_verified && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-500/80 backdrop-blur-md rounded-full text-white flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Favorite Toggle with Animation */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleFavoriteClick}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
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
              <div className="relative px-4 py-2.5 bg-gradient-to-r from-[#C026D3] to-[#9333EA] rounded-xl overflow-hidden shadow-lg">
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
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white tracking-wide">
                      PROMO TERSEDIA
                    </span>
                  </div>
                  {promo.price_value && (
                    <span className="text-lg font-bold text-white">
                      Rp{Math.round(promo.price_value).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Badge */}
        {venue.rating && venue.rating > 0 && (
          <div className="absolute bottom-3 right-3 z-30 md:hidden">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {venue.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="h-[45%] p-4 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-syne font-bold text-lg text-white leading-tight line-clamp-1 group-hover:text-[#C026D3] transition-colors tracking-[-0.03em]">
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

          {/* Description */}
          {venue.description && (
            <p className="text-sm text-white/60 line-clamp-2 leading-relaxed tracking-[-0.01em]">
              {venue.description}
            </p>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex items-end justify-between pt-2">
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

          {/* Features Tags */}
          {venue.features && venue.features.length > 0 && (
            <div className="flex gap-1.5 overflow-hidden">
              {venue.features.slice(0, 2).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/60 whitespace-nowrap"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Border Glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#C026D3]/30" />
      </div>
    </motion.article>
  );
}

/**
 * VenueCardSkeleton - Custom shimmer placeholder
 * Mimics exact card structure
 */
export function VenueCardSkeleton() {
  return (
    <div 
      className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 animate-pulse"
      style={{ aspectRatio: '4 / 5' }}
    >
      {/* Image placeholder */}
      <div className="h-[55%] bg-white/5 relative">
        <div className="absolute top-3 left-3">
          <div className="h-7 w-20 bg-white/10 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-10 w-10 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Content placeholder */}
      <div className="h-[45%] p-4 space-y-3">
        <div className="h-6 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 bg-white/10 rounded-full" />
          <div className="h-6 w-16 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
