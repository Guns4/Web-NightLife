/**
 * =====================================================
 * PROMO HERO SLIDER
 * High-end autoplaying slider for boosted venues
 * =====================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";

interface BoostedVenue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  category: string;
  address: string | null;
  trustScore: number;
  galleryImages: string[];
  boostType: string;
  isVerified: boolean;
  isBoosted?: boolean;
}

interface PromoHeroSliderProps {
  venues?: BoostedVenue[];
  autoPlayInterval?: number;
}

export default function PromoHeroSlider({ 
  venues: initialVenues, 
  autoPlayInterval = 5000 
}: PromoHeroSliderProps) {
  const [venues, setVenues] = useState<BoostedVenue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(!initialVenues);

  // Fetch boosted venues if not provided
  useEffect(() => {
    if (initialVenues && initialVenues.length > 0) {
      setVenues(initialVenues);
      return;
    }

    async function fetchBoostedVenues() {
      try {
        const response = await fetch(
          `/api/venues/search?lat=-6.2&lng=106.8&radius_km=100&limit=10`
        );
        const data = await response.json();
        
        // Filter for boosted venues with homepage banner
        const boosted = (data.venues || []).filter(
          (v: BoostedVenue) => v.isBoosted && v.boostType === "homepage_banner"
        );
        
        setVenues(boosted);
      } catch (error) {
        console.error("Failed to fetch boosted venues:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoostedVenues();
  }, [initialVenues]);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying || venues.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % venues.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, venues.length, autoPlayInterval]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + venues.length) % venues.length);
  }, [venues.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % venues.length);
  }, [venues.length]);

  if (isLoading) {
    return (
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full bg-gray-900 animate-pulse rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />
      </div>
    );
  }

  if (venues.length === 0) {
    return null;
  }

  const currentVenue = venues[currentIndex];

  return (
    <div 
      className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVenue.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image with Parallax */}
          <div className="absolute inset-0">
            {currentVenue.galleryImages && currentVenue.galleryImages[0] ? (
              <Image
                src={currentVenue.galleryImages[0]}
                alt={currentVenue.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-pink-900/60" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/40" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-2xl px-6 md:px-12">
              {/* Boost Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400"
              >
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Featured Venue
              </motion.div>

              {/* Venue Name */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 font-syne"
              >
                {currentVenue.name}
              </motion.h2>

              {/* Location & Rating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 mb-4"
              >
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{currentVenue.city}</span>
                  {currentVenue.address && (
                    <span className="text-white/50">• {currentVenue.address}</span>
                  )}
                </div>
                {currentVenue.isVerified && (
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Verified</span>
                  </div>
                )}
              </motion.div>

              {/* Description */}
              {currentVenue.description && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/70 text-lg mb-6 line-clamp-2"
                >
                  {currentVenue.description}
                </motion.p>
              )}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href={`/venue/${currentVenue.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                >
                  View Details
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:border-amber-500/30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:border-amber-500/30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {venues.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-amber-400 w-8"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white/60 text-sm">
        {currentIndex + 1} / {venues.length}
      </div>
    </div>
  );
}
