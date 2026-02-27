"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { 
  VenueCategory, 
  Atmosphere, 
  ATMOSPHERE_OPTIONS 
} from "@/lib/database/types";

/**
 * FilterDrawer Props
 */
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: VenueCategory | null;
  onCategoryChange: (category: VenueCategory | null) => void;
  selectedAtmospheres: Atmosphere[];
  onAtmosphereChange: (atmospheres: Atmosphere[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onApply: () => void;
  onReset: () => void;
}

/**
 * FilterDrawer - Bottom Sheet for mobile filtering
 * Uses framer-motion for smooth pull-up gestures
 */
export default function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  onCategoryChange,
  selectedAtmospheres,
  onAtmosphereChange,
  priceRange,
  onPriceRangeChange,
  onApply,
  onReset,
}: FilterDrawerProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);

  const categories: { value: VenueCategory | null; label: string }[] = [
    { value: null, label: "All" },
    { value: "club", label: "Club" },
    { value: "karaoke", label: "Karaoke" },
    { value: "ktv", label: "KTV" },
    { value: "spa", label: "Spa" },
  ];

  const handleAtmosphereToggle = (atmosphere: Atmosphere) => {
    if (selectedAtmospheres.includes(atmosphere)) {
      onAtmosphereChange(selectedAtmospheres.filter(a => a !== atmosphere));
    } else {
      onAtmosphereChange([...selectedAtmospheres, atmosphere]);
    }
  };

  const handleApply = () => {
    onPriceRangeChange(localPriceRange);
    onApply();
    onClose();
  };

  const handleReset = () => {
    onCategoryChange(null);
    onAtmosphereChange([]);
    onPriceRangeChange([1, 4]);
    onReset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F] rounded-t-[2rem] border-t border-white/10 z-50 md:hidden max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-4">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#C026D3]" />
                <h2 className="font-syne font-bold text-xl text-white">
                  Filters
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Category Section */}
              <section>
                <h3 className="font-semibold text-white mb-3 tracking-wide">
                  Category
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => onCategoryChange(cat.value)}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] ${
                        selectedCategory === cat.value
                          ? "bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white shadow-lg"
                          : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Price Range Section */}
              <section>
                <h3 className="font-semibold text-white mb-3 tracking-wide">
                  Price Range
                </h3>
                <div className="px-2">
                  <div className="flex justify-between text-sm text-white/60 mb-4">
                    <span>{'$'.repeat(localPriceRange[0])}</span>
                    <span>{'$'.repeat(localPriceRange[1])}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={localPriceRange[0]}
                    onChange={(e) => setLocalPriceRange([parseInt(e.target.value), localPriceRange[1]])}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C026D3]"
                  />
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={localPriceRange[1]}
                    onChange={(e) => setLocalPriceRange([localPriceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C026D3] mt-2"
                  />
                  <div className="flex justify-between mt-2 text-xs text-white/40">
                    <span>Budget</span>
                    <span>Premium</span>
                  </div>
                </div>
              </section>

              {/* Atmosphere Section */}
              <section>
                <h3 className="font-semibold text-white mb-3 tracking-wide">
                  Atmosphere
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ATMOSPHERE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAtmosphereToggle(option.value)}
                      className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 min-h-[44px] ${
                        selectedAtmospheres.includes(option.value)
                          ? "bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white shadow-lg"
                          : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-white/10 bg-[#0A0A0F]">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors min-h-[50px]"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#C026D3] to-[#9333EA] hover:shadow-[0_0_20px_rgba(192,38,211,0.4)] transition-shadow min-h-[50px]"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * FilterButton - Mobile filter trigger
 * Shows active filter count
 */
interface FilterButtonProps {
  onClick: () => void;
  activeFilters: number;
}

export function FilterButton({ onClick, activeFilters }: FilterButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white min-h-[44px]"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span className="font-medium text-sm">Filters</span>
      {activeFilters > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-[#C026D3] rounded-full text-xs font-bold">
          {activeFilters}
        </span>
      )}
    </motion.button>
  );
}
