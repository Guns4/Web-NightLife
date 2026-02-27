"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Star, Sparkles } from "lucide-react";
import { Venue, Promo, getPriceRangeDisplay, getCategoryLabel } from "@/lib/database/types";

/**
 * ResultCard Props
 */
interface ResultCardProps {
  venue: Venue;
  promo?: Promo | null;
  onClick?: () => void;
}

/**
 * Premium ResultCard Component
 * Glassmorphism style with dynamic badges and animations
 */
export default function ResultCard({ venue, promo, onClick }: ResultCardProps) {
  const priceDisplay = getPriceRangeDisplay(venue.price_range);
  const categoryLabel = getCategoryLabel(venue.category);

  // Get the first image or use a placeholder
  const imageUrl = venue.images && venue.images.length > 0 
    ? venue.images[0] 
    : "/images/placeholder-venue.jpg";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(192,38,211,0.15)]"
    >
      {/* Image Container with Blur Placeholder */}
      <div className="relative h-48 overflow-hidden">
        {/* Blur placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 z-0" />
        
        {/* Image */}
        <Image
          src={imageUrl}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110 z-10"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-30">
          <span className="px-3 py-1.5 text-xs font-medium bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10">
            {categoryLabel}
          </span>
        </div>

        {/* Promo Badge - Dynamic */}
        {promo && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-[#C026D3] to-[#9333EA] rounded-full text-white shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3 inline-block mr-1" />
              {promo.title}
            </span>
          </div>
        )}

        {/* Rating Badge */}
        {venue.rating && venue.rating > 0 && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-white">
              {venue.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-syne font-bold text-lg text-white leading-tight line-clamp-1 group-hover:text-[#C026D3] transition-colors">
            {venue.name}
          </h3>
          <span className="text-sm font-medium text-white/60 whitespace-nowrap">
            {priceDisplay}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/50">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">
            {venue.city}{venue.address && `, ${venue.address}`}
          </span>
        </div>

        {/* Description */}
        {venue.description && (
          <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
            {venue.description}
          </p>
        )}

        {/* Features Tags */}
        {venue.features && venue.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {venue.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/70"
              >
                {feature}
              </span>
            ))}
            {venue.features.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-white/50">
                +{venue.features.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      </div>
    </motion.article>
  );
}

/**
 * ResultCardSkeleton - Loading state
 */
export function ResultCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
      <div className="h-48 bg-white/5 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
