"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, RefreshCw, ChevronRight, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getVenuesNearMe } from "@/lib/actions/discovery";
import { VenueWithRelations, Promo } from "@/lib/database/types";
import { formatDistance } from "@/lib/utils/geo";
import VenueCard from "@/components/cards/VenueCard";

/**
 * NearYouSection Props
 */
interface NearYouSectionProps {
  onVenueClick?: (venueId: string) => void;
}

/**
 * "Destinasi Terdekat" Section - Horizontal scroll with location-based discovery
 */
export default function NearYouSection({ onVenueClick }: NearYouSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [venues, setVenues] = useState<VenueWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRadius, setExpandedRadius] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { 
    latitude, 
    longitude, 
    areaName, 
    city,
    isLoading: locationLoading,
    error: locationError,
    permissionStatus,
    requestLocation 
  } = useGeolocation();

  // Fetch nearby venues
  const fetchNearbyVenues = useCallback(async () => {
    if (!latitude || !longitude) return;
    
    setIsLoading(true);
    try {
      const result = await getVenuesNearMe(latitude, longitude, 5, 15, 10);
      setVenues(result.venues);
      setExpandedRadius(result.expandedRadius);
    } catch (error) {
      console.error("Error fetching nearby venues:", error);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  // Fetch venues when location is detected
  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyVenues();
    }
  }, [latitude, longitude, fetchNearbyVenues]);

  // Handle location request
  const handleRequestLocation = async () => {
    setIsDetectingLocation(true);
    await requestLocation();
    setIsDetectingLocation(false);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Don't render if no location access
  if (permissionStatus === "denied") {
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      <div className="px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C026D3]/10">
              <MapPin className="w-5 h-5 text-[#C026D3]" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-xl md:text-2xl text-white tracking-tight">
                Destinasi Terdekat
              </h2>
              {city && areaName && (
                <p className="text-sm text-white/50">
                  {areaName}, {city}
                </p>
              )}
            </div>
          </div>

          {/* Scroll Controls */}
          {venues.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronRight className="w-4 h-4 text-white rotate-180" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {!latitude && !locationLoading ? (
          // Location Permission Request
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#C026D3]/20 to-[#9333EA]/20 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-[#C026D3]" />
            </div>
            <h3 className="font-syne font-bold text-xl text-white mb-2">
              Aktifkan Lokasi Anda
            </h3>
            <p className="text-white/60 text-center max-w-sm mb-6">
              Temukan venue terdekat dari lokasi Anda untuk pengalaman nightlife terbaik
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRequestLocation}
              disabled={isDetectingLocation}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white font-semibold flex items-center gap-2"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mendeteksi Lokasi...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Aktifkan Lokasi
                </>
              )}
            </motion.button>
            {locationError && (
              <p className="text-red-400 text-sm mt-4">{locationError}</p>
            )}
          </motion.div>
        ) : locationLoading || isLoading ? (
          // Loading State with Animation
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity 
              }}
              className="w-16 h-16 mb-6 rounded-full border-2 border-[#C026D3] border-t-transparent flex items-center justify-center"
            >
              <MapPin className="w-8 h-8 text-[#C026D3]" />
            </motion.div>
            <p className="text-white/60 animate-pulse">
              Mencari venue terdekat...
            </p>
          </div>
        ) : venues.length === 0 ? (
          // No Venues Found
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <p className="text-white/60 mb-4">
              Tidak ada venue ditemukan dalam radius 15km
            </p>
            <button
              onClick={fetchNearbyVenues}
              className="flex items-center gap-2 text-[#C026D3] hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </motion.div>
        ) : (
          // Venue Cards Horizontal Scroll
          <div className="relative">
            {/* Expanded Radius Notification */}
            <AnimatePresence>
              {expandedRadius && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 px-4 py-2 bg-[#C026D3]/10 border border-[#C026D3]/20 rounded-full flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#C026D3] animate-spin" />
                  <span className="text-sm text-[#C026D3]">
                    Memperluas jangkauan pencarian ke 15km
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Horizontal Scroll Container */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex-shrink-0 w-[260px] md:w-[280px] snap-start"
                >
                  <VenueCard
                    venue={venue}
                    promo={venue.promos?.[0] as Promo | null}
                    liveVibe={venue.live_vibe}
                    onClick={() => onVenueClick?.(venue.id)}
                  />
                  {/* Distance Badge */}
                  {venue.distance_km !== undefined && (
                    <div className="mt-2 text-center">
                      <span className="text-sm text-white/50">
                        {formatDistance(venue.distance_km)} dari lokasi Anda
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
