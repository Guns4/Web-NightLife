/**
 * MOLECULE: SearchBar
 * Search input with filters
 */

import { useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

export interface SearchFilters {
  query: string;
  city?: string;
  category?: string;
  priceRange?: number;
  rating?: number;
}

export interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  initialFilters?: Partial<SearchFilters>;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search venues, events, or vibes...',
  showFilters = true,
  initialFilters = {},
}: SearchBarProps) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<Partial<SearchFilters>>(initialFilters);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, ...filters });
  }, [query, filters, onSearch]);

  const handleClear = () => {
    setQuery('');
    setFilters({});
    onSearch({ query: '' });
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          {showFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          )}
          
          <Button type="submit" variant="primary">
            Search
          </Button>
        </div>
      </form>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                City
              </label>
              <select
                value={filters.city || ''}
                onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Cities</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bali">Bali</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Bandung">Bandung</option>
                <option value="Medan">Medan</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Categories</option>
                <option value="club">Club</option>
                <option value="bar">Bar</option>
                <option value="lounge">Lounge</option>
                <option value="rooftop">Rooftop</option>
                <option value="restaurant">Restaurant</option>
                <option value="karaoke">Karaoke</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price Range
              </label>
              <select
                value={filters.priceRange || 0}
                onChange={(e) => setFilters({ ...filters, priceRange: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="0">Any</option>
                <option value="1">$</option>
                <option value="2">$$</option>
                <option value="3">$$$</option>
                <option value="4">$$$$</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Minimum Rating
              </label>
              <select
                value={filters.rating || 0}
                onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="0">Any</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
