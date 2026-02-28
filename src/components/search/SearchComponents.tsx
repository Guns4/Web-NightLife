'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock, X, Navigation } from 'lucide-react';
import { useDebounce, useGeolocation, useSearchHistory, calculateDistance, formatDistance } from '@/lib/hooks/useSearch';

// Types
interface Venue {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  distance?: number;
  imageUrl?: string;
  isOpen?: boolean;
}

interface SearchAutocompleteProps {
  onSelect: (venue: Venue) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

interface SearchCardSkeletonProps {
  count?: number;
}

// =====================================================
// SKELETON LOADING COMPONENT
// =====================================================

export function SearchCardSkeleton({ count = 3 }: SearchCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-4 flex gap-4"
        >
          {/* Image skeleton */}
          <div className="w-24 h-24 rounded-lg bg-dark-graphite animate-pulse" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 bg-dark-graphite rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-dark-graphite rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-dark-graphite rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// =====================================================
// AUTOCOMPLETE COMPONENT
// =====================================================

export function SearchAutocomplete({ onSelect, onSearch, placeholder = 'Search venues...' }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Venue[]>([]);
  const [recentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams({
          query: debouncedQuery,
          limit: '5',
        });
        
        if (latitude && longitude) {
          params.set('lat', String(latitude));
          params.set('lng', String(longitude));
        }

        const response = await fetch(`/api/v1/venues/search?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.venues || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, latitude, longitude]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  // Handle selection
  const handleSelect = (venue: Venue) => {
    addToHistory(venue.name);
    setQuery(venue.name);
    setIsOpen(false);
    onSelect(venue);
  };

  // Handle recent search selection
  const handleRecentSelect = (search: string) => {
    setQuery(search);
    onSearch(search);
    setIsOpen(false);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToHistory(query);
      onSearch(query);
      setIsOpen(false);
      router.push(`/discovery?q=${encodeURIComponent(query)}`);
    }
  };

  // Show autocomplete when typing or showing history
  const showDropdown = isOpen && (query.length > 0 || history.length > 0);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search Icon */}
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            className="w-full bg-dark-charcoal/50 border border-glass-border rounded-xl py-3 pl-12 pr-24 text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all"
            autoComplete="off"
          />
          
          {/* Right side actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Geolocation indicator */}
            {latitude && longitude && (
              <div className="p-1.5 text-neon-green" title="Location enabled">
                <Navigation className="w-4 h-4" />
              </div>
            )}
            
            {/* Clear button */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card z-50 overflow-hidden"
          >
            {/* Recent Searches */}
            {!query && history.length > 0 && (
              <div className="p-2 border-b border-glass-border">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </span>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {history.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSelect(search)}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-500" />
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Venue Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-400">Suggested Venues</div>
                {suggestions.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => handleSelect(venue)}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-dark-graphite flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{venue.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{venue.category}</span>
                        {venue.distance !== undefined && (
                          <>
                            <span>•</span>
                            <span>{formatDistance(venue.distance)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// SEARCH RESULTS COMPONENT
// =====================================================

interface SearchResultsProps {
  venues: Venue[];
  isLoading: boolean;
  userLat?: number | null;
  userLng?: number | null;
}

export function SearchResults({ venues, isLoading, userLat, userLng }: SearchResultsProps) {
  if (isLoading) {
    return <SearchCardSkeleton count={5} />;
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl text-white mb-2">No venues found</h3>
        <p className="text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {venues.map((venue, index) => {
        const distance = userLat && userLng && venue.distance !== undefined
          ? venue.distance
          : undefined;

        return (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 flex gap-4 cursor-pointer hover:border-neon-cyan/30"
          >
            {/* Image */}
            <div className="w-24 h-24 rounded-lg bg-dark-graphite flex-shrink-0 overflow-hidden">
              {venue.imageUrl ? (
                <img
                  src={venue.imageUrl}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{venue.name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <span>{venue.category}</span>
                {venue.rating && (
                  <>
                    <span>•</span>
                    <span className="text-neon-gold">★ {venue.rating.toFixed(1)}</span>
                  </>
                )}
              </p>
              <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{venue.address}</span>
              </p>
              {distance !== undefined && (
                <p className="text-neon-cyan text-sm mt-1">
                  {formatDistance(distance)}
                </p>
              )}
            </div>

            {/* Open status */}
            {venue.isOpen !== undefined && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                venue.isOpen
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {venue.isOpen ? 'Open' : 'Closed'}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// =====================================================
// CATEGORY FILTER COMPONENT
// =====================================================

interface CategoryFilterProps {
  categories: string[];
  selected: string[];
  onChange: (categories: string[]) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter(c => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => toggleCategory(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected.includes(category)
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-obsidian'
              : 'glass border border-glass-border text-gray-300 hover:border-neon-cyan/50'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
