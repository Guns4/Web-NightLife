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
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 animate-pulse" />
  );
}

/**
 * Hero Section Component
 * Features:
 * - Lazy-loaded video background (zero impact on TBT)
 * - Cloudinary integration with adaptive bitrate
 * - Low Quality Image Placeholder (LIP)
 * - Glassmorphism search bar with premium animations
 * - Category pills with staggered entry
 */
export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <section className="relative h-screen min-h-[600px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden">
      {/* Video Background - Lazy loaded with LIP placeholder */}
      <div className="absolute inset-0 z-0">
        <LazyVideoBackground />
        
        {/* Complex Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,transparent_40%,rgba(192,38,211,0.08)_60%,rgba(192,38,211,0.15)_80%,rgba(0,0,0,0.95)_100%)]" />
        
        {/* Bottom black overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Additional dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
        {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-syne font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-[-0.02em]"
          >
            Temukan Hiburan{" "}
            <span className="text-white">Malam</span>{" "}
            <span className="gradient-text">Terbaik</span>{" "}
            <span className="text-white">anda</span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-inter font-normal text-base md:text-lg lg:text-xl text-white/80 max-w-[600px] mx-auto leading-relaxed"
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
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full border border-white/20 transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30" />
              
              {/* Search input with icons */}
              <div className="relative flex items-center px-4 md:px-6 py-3 md:py-4">
                <MapPin className="w-5 h-5 text-white/60 flex-shrink-0 ml-1" />
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
                  className="relative px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white font-medium text-sm md:text-base overflow-hidden group-hover:shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-shadow min-h-[48px] min-w-[80px]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Cari</span>
                  </span>
                  <span className="absolute inset-0 rounded-full animate-ping bg-white/20" />
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
                        ? "bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white shadow-[0_0_20px_rgba(192,38,211,0.3)]"
                        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/30"
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
