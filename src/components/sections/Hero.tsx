"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Search, MapPin, Mic, Music, Sparkles, MoreHorizontal } from "lucide-react";

// Lazy load the video component for better TBT
const LazyVideoBackground = dynamic(() => import("./LazyVideoBackground"), {
  ssr: false,
  loading: () => <VideoPlaceholder />,
});

/**
 * Category type definition
 */
interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Categories for the hero section
 */
const categories: Category[] = [
  { id: "karaoke", label: "Karaoke", icon: Mic },
  { id: "club", label: "Club", icon: Music },
  { id: "spa", label: "Spa", icon: Sparkles },
  { id: "ktv", label: "KTV", icon: Mic },
  { id: "others", label: "Others", icon: MoreHorizontal },
];

/**
 * Loading skeleton for video placeholder
 */
function VideoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-royal-purple/40 to-gold-premium/20 animate-pulse" />
  );
}

/**
 * Hero Section Component - Gold Neon Futuristic Design
 * Features:
 * - Golden City Video background with 60% dark overlay
 * - Shimmer effect for headline text
 * - Magnetic CTA buttons with pulse animation
 */
export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <section className="relative h-screen min-h-[600px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden">
      {/* Video Background - Lazy loaded with LIP placeholder */}
      <div className="absolute inset-0 z-0">
        <LazyVideoBackground />
        
        {/* 60% Dark Overlay for Golden City Video */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Complex Radial Gradient Overlay with Gold/Purple tones */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,transparent_40%,rgba(199,164,15,0.08)_60%,rgba(66,15,77,0.15)_80%,rgba(0,0,0,0.95)_100%)] z-20" />
        
        {/* Bottom black overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-30" />
      </div>

      {/* Content Container */}
      <div className="relative z-40 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
        {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Heading with Metallic Shimmer Effect */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-syne font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-[-0.02em]"
          >
            Temukan Hiburan{" "}
            <span className="text-white">Malam</span>{" "}
            <span className="metallic-shine text-shimmer">Terbaik</span>{" "}
            <span className="text-white">anda</span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-inter font-normal text-base md:text-lg lg:text-xl text-white/80 max-w-[600px] mx-auto leading-relaxed tracking-wide"
          >
            Booking Tempat Karaoke, Club, dan Spa favoritmu lebih mudah dan nikmati pengalaman malam yang tak terlupakan.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full max-w-2xl mx-auto mt-8"
          >
            <div className="relative group">
              {/* Glass effect container */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full border border-gold-premium/20 transition-all duration-300 group-hover:bg-white/15 group-hover:border-gold-premium/30" />
              
              {/* Search input with icons */}
              <div className="relative flex items-center px-4 md:px-6 py-3 md:py-4">
                <MapPin className="w-5 h-5 text-gold-premium/60 flex-shrink-0 ml-1" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari venue, lokasi..."
                  className="flex-1 bg-transparent text-white placeholder-white/60 px-4 py-2 text-sm md:text-base font-inter outline-none min-h-[44px]"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-6 py-2.5 rounded-full bg-gradient-gold-premium text-black font-medium text-sm md:text-base overflow-hidden group-hover:shadow-[0_0_20px_rgba(199,164,15,0.4)] transition-shadow min-h-[48px] min-w-[80px] btn-magnetic btn-haptic"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Cari</span>
                  </span>
                  <span className="absolute inset-0 rounded-full animate-ping bg-gold-premium/30" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center mt-8 md:mt-10 w-full"
          >
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full max-w-3xl px-2">
              {categories.map((category, index) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 min-h-[44px] ${
                      isSelected
                        ? "bg-gradient-gold-premium text-black shadow-[0_0_20px_rgba(199,164,15,0.4)]"
                        : "bg-white/10 backdrop-blur-sm border border-gold-premium/20 text-white/90 hover:bg-white/20 hover:border-gold-premium/30"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
