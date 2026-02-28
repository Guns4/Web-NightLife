"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
  currentLocation?: string;
  debounceMs?: number;
}

/**
 * Search Bar with Debounce
 * Prevents excessive API calls during typing
 */
export default function SearchBar({ 
  onSearch, 
  onLocationRequest,
  isLoadingLocation,
  currentLocation,
  debounceMs = 300 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      } else {
        onSearch("");
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <motion.div 
      className="relative z-30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`
        flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300
        ${isFocused 
          ? "bg-black/40 border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.15)]" 
          : "bg-white/5 border-[#FFD700]/20 hover:border-[#FFD700]/40"
        }
      `}>
        {/* Search Icon */}
        <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-[#FFD700]" : "text-white/50"}`} />
        
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search venues, bars, clubs..."
          className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-base"
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Location Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLocationRequest}
          disabled={isLoadingLocation}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl transition-all
            ${currentLocation 
              ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30" 
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-transparent"
            }
          `}
        >
          {isLoadingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span className="text-sm font-medium whitespace-nowrap">
            {currentLocation || "Near Me"}
          </span>
        </motion.button>
      </div>

      {/* Search Suggestions (Future Enhancement) */}
      <AnimatePresence>
        {isFocused && query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl rounded-2xl border border-[#FFD700]/20 overflow-hidden"
          >
            {/* Add search suggestions here */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
