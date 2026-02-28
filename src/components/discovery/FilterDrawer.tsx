"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, Check } from "lucide-react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  musicGenres: string[];
  vibes: string[];
  facilities: string[];
  priceRange: string | null;
  radiusKm: number;
}

const MUSIC_GENRES = [
  "Jazz", "House", "Hip Hop", "R&B", "Pop", "Rock", 
  "Electronic", "Latin", "Retro", "K-Pop"
];

const VIBES = [
  "Speakeasy", "Rooftop", "Underground", "Luxury", "Casual",
  "Romantic", "Party", "Chill", "Live Music", "VIP"
];

const FACILITIES = [
  "VIP", "Outdoor", "Smoking Area", "Non-Smoking", "Private Room",
  "Parking", "Wheelchair Accessible", "Live Band", "DJ", "Karaoke"
];

const PRICE_RANGES = [
  { id: "low", label: "Budget", range: "Under Rp 150K" },
  { id: "medium", label: "Mid-Range", range: "Rp 150K - 350K" },
  { id: "high", label: "Premium", range: "Rp 350K - 750K" },
  { id: "ultra", label: "Ultra Premium", range: "Above Rp 750K" },
];

/**
 * Filter Drawer - Side Panel for Advanced Filters
 */
export default function FilterDrawer({ 
  isOpen, 
  onClose, 
  onApply,
  initialFilters 
}: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    musicGenres: [],
    vibes: [],
    facilities: [],
    priceRange: null,
    radiusKm: 10,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    musicGenres: true,
    vibes: true,
    facilities: true,
    priceRange: true,
    radius: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleArrayValue = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter(v => v !== value);
    }
    return [...array, value];
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      musicGenres: [],
      vibes: [],
      facilities: [],
      priceRange: null,
      radiusKm: 10,
    });
  };

  const activeFilterCount = 
    filters.musicGenres.length + 
    filters.vibes.length + 
    filters.facilities.length + 
    (filters.priceRange ? 1 : 0);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0A0F] border-l border-[#FFD700]/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#FFD700]/20">
              <div>
                <h2 className="font-syne font-bold text-xl text-white">Filters</h2>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-[#FFD700]">{activeFilterCount} active</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Music Genres */}
              <FilterSection
                title="Music Genre"
                isExpanded={expandedSections.musicGenres}
                onToggle={() => toggleSection("musicGenres")}
              >
                <div className="flex flex-wrap gap-2">
                  {MUSIC_GENRES.map((genre) => (
                    <FilterChip
                      key={genre}
                      label={genre}
                      isActive={filters.musicGenres.includes(genre)}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        musicGenres: toggleArrayValue(prev.musicGenres, genre)
                      }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Vibes */}
              <FilterSection
                title="Vibe"
                isExpanded={expandedSections.vibes}
                onToggle={() => toggleSection("vibes")}
              >
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((vibe) => (
                    <FilterChip
                      key={vibe}
                      label={vibe}
                      isActive={filters.vibes.includes(vibe)}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        vibes: toggleArrayValue(prev.vibes, vibe)
                      }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Facilities */}
              <FilterSection
                title="Facilities"
                isExpanded={expandedSections.facilities}
                onToggle={() => toggleSection("facilities")}
              >
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map((facility) => (
                    <FilterChip
                      key={facility}
                      label={facility}
                      isActive={filters.facilities.includes(facility)}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        facilities: toggleArrayValue(prev.facilities, facility)
                      }))}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection
                title="Price Range"
                isExpanded={expandedSections.priceRange}
                onToggle={() => toggleSection("priceRange")}
              >
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        priceRange: prev.priceRange === range.id ? null : range.id
                      }))}
                      className={`
                        p-3 rounded-xl border text-left transition-all
                        ${filters.priceRange === range.id
                          ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]"
                          : "bg-white/5 border-[#FFD700]/20 text-white/70 hover:border-[#FFD700]/40"
                        }
                      `}
                    >
                      <div className="font-medium text-sm">{range.label}</div>
                      <div className="text-xs opacity-60">{range.range}</div>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Radius */}
              <FilterSection
                title="Distance Radius"
                isExpanded={expandedSections.radius}
                onToggle={() => toggleSection("radius")}
              >
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.radiusKm}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      radiusKm: parseInt(e.target.value)
                    }))}
                    className="w-full accent-[#FFD700]"
                  />
                  <div className="flex justify-between text-sm text-white/60">
                    <span>1 km</span>
                    <span className="text-[#FFD700] font-medium">{filters.radiusKm} km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#FFD700]/20 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border border-[#FFD700]/30 text-white/70 hover:text-white hover:border-[#FFD700]/50 transition-colors font-medium"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold hover:bg-[#D4AF37] transition-colors"
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
 * Filter Section Component
 */
function FilterSection({ 
  title, 
  children, 
  isExpanded, 
  onToggle 
}: { 
  title: string; 
  children: React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="border border-[#FFD700]/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="font-medium text-white">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#FFD700]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/50" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Filter Chip Component
 */
function FilterChip({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5
        ${isActive
          ? "bg-[#FFD700] text-black border-[#FFD700]"
          : "bg-white/5 text-white/70 border-[#FFD700]/20 hover:border-[#FFD700]/40"
        }
      `}
    >
      {isActive && <Check className="w-3 h-3" />}
      {label}
    </button>
  );
}
