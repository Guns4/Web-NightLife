"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Mic, Music, Sparkles, MoreHorizontal } from "lucide-react";

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
 * Hero Section Component
 * Features:
 * - Video background with overlay
 * - Glassmorphism search bar
 * - Category capsules with hover animations
 * - Mobile-optimized (85% focus)
 */
export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <section className="relative h-screen min-h-[600px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlay - Black to Transparent to Black */}
        <div className="absolute inset-0 bg-gradient-dark-overlay" />
        
        {/* Additional dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
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
            className="font-syne font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight"
          >
            Discover Your{" "}
            <span className="gradient-text">Perfect Night</span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-inter font-normal text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
          >
            Experience the finest nightlife venues. From exclusive clubs to private karaoke rooms, 
            find your next unforgettable evening.
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
              
              {/* Search input */}
              <div className="relative flex items-center px-4 md:px-6 py-3 md:py-4">
                <MapPin className="w-5 h-5 text-white/60 flex-shrink-0 ml-1" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues, locations..."
                  className="flex-1 bg-transparent text-white placeholder-white/60 px-4 py-2 text-sm md:text-base font-inter outline-none"
                />
                <button className="relative px-6 py-2.5 rounded-full bg-gradient-premium-purple text-white font-medium text-sm md:text-base overflow-hidden group-hover:shadow-soft-glow transition-shadow">
                  <span className="relative z-10 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Category Capsules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3 mt-8 md:mt-10"
          >
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
                  className={`relative px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-premium-purple text-white shadow-soft-glow"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
            >
              <div className="w-1 h-2 bg-white/50 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
