"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mic2, 
  Disc3, 
  Wine, 
  Mic, 
  Music, 
  Sparkles,
  X,
  SlidersHorizontal
} from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Sticky Category Navigation
 * Horizontal scrollable with icons
 */
export default function CategoryNav({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  onOpenFilters,
  hasActiveFilters 
}: CategoryNavProps) {
  return (
    <div className="sticky top-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-[#FFD700]/20">
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Filter Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenFilters}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
            hasActiveFilters 
              ? "bg-[#FFD700] text-black border-[#FFD700]" 
              : "bg-white/5 text-white border-[#FFD700]/30 hover:border-[#FFD700]/60"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-black" />
          )}
        </motion.button>

        {/* Categories */}
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                isActive
                  ? "bg-[#FFD700] text-black border-[#FFD700]"
                  : "bg-white/5 text-white/70 border-[#FFD700]/20 hover:border-[#FFD700]/50 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{category.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Default categories for nightlife venues
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "nightclub", label: "Club", icon: Disc3 },
  { id: "bar", label: "Bar", icon: Wine },
  { id: "karaoke", label: "Karaoke", icon: Mic },
  { id: "ktv", label: "KTV", icon: Mic2 },
  { id: "lounge", label: "Lounge", icon: Music },
];
