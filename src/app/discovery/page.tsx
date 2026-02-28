'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extended category type with more options
type VenueCategory = 'club' | 'bar' | 'karaoke' | 'ktv' | 'spa' | 'wellness' | 'restaurant' | 'lounge' | 'rooftop' | 'beach_club';

interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  city: string;
  address: string | null;
  price_range: number;
  rating: number;
  images: string[];
  is_active: boolean;
}

const CATEGORIES: { value: VenueCategory; label: string; icon: string }[] = [
  { value: 'club', label: 'Club', icon: '🎵' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'lounge', label: 'Lounge', icon: '🛋️' },
  { value: 'karaoke', label: 'Karaoke', icon: '🎤' },
  { value: 'ktv', label: 'KTV', icon: '🎤' },
  { value: 'spa', label: 'Wellness & Reflexology', icon: '💆' },
  { value: 'wellness', label: 'Wellness', icon: '🧘' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'rooftop', label: 'Rooftop', icon: '🌆' },
  { value: 'beach_club', label: 'Beach Club', icon: '🏖️' },
];

const CITIES = [
  { value: '', label: 'All Cities' },
  { value: 'Jakarta', label: 'Jakarta' },
  { value: 'Bali', label: 'Bali' },
  { value: 'Surabaya', label: 'Surabaya' },
  { value: 'Bandung', label: 'Bandung' },
  { value: 'Medan', label: 'Medan' },
];

// Advanced Professional Filters
const SECURITY_FILTERS = [
  { value: 'cctv', label: 'CCTV' },
  { value: 'professional_guard', label: 'Professional Guard' },
];

const AMBIANCE_FILTERS = [
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'indoor_smoking', label: 'Indoor Smoking' },
  { value: 'live_band', label: 'Live Band' },
];

const WELLNESS_FILTERS = [
  { value: 'sauna', label: 'Sauna' },
  { value: 'cold_plunge', label: 'Cold Plunge' },
  { value: 'aromatherapy', label: 'Aromatherapy' },
];

function getCategoryLabel(category: string): string {
  const found = CATEGORIES.find(c => c.value === category);
  return found?.label || category;
}

function getCategoryIcon(category: string): string {
  const found = CATEGORIES.find(c => c.value === category);
  return found?.icon || '📍';
}

function getPriceLabel(priceRange: number): string {
  const labels = ['$', '$$', '$$$', '$$$$'];
  return labels[priceRange - 1] || '$';
}

export default function DiscoveryPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | ''>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [securityFilters, setSecurityFilters] = useState<string[]>([]);
  const [ambianceFilters, setAmbianceFilters] = useState<string[]>([]);
  const [wellnessFilters, setWellnessFilters] = useState<string[]>([]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedCity) {
        query = query.ilike('city', `%${selectedCity}%`);
      }

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
      } else {
        setVenues(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCity, searchQuery]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    setFilteredVenues(venues);
  }, [venues]);

  const handleCategoryChange = (category: VenueCategory | '') => {
    setSelectedCategory(category);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCity('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedCity || searchQuery;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-yellow-500/20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Discover
            </span>{' '}
            <span className="text-white">Venues</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Find your next favorite nightlife destination
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="border-b border-yellow-500/10 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm whitespace-nowrap">City:</label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors min-w-[140px]"
              >
                {CITIES.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-yellow-500 hover:text-yellow-400 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === ''
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  selectedCategory === category.value
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-gray-400 text-sm">
          {loading ? 'Loading...' : `${filteredVenues.length} venue${filteredVenues.length !== 1 ? 's' : ''} found`}
          {selectedCategory && ` in ${getCategoryLabel(selectedCategory)}`}
          {selectedCity && `, ${selectedCity}`}
        </p>
      </div>

      {/* Venue Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-xl border border-gray-800 animate-pulse"
              >
                <div className="h-48 bg-gray-800 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No venues found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.id}`}
                className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-800 overflow-hidden">
                  {venue.images && venue.images.length > 0 ? (
                    <Image
                      src={venue.images[0]}
                      alt={venue.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 text-4xl">
                      {getCategoryIcon(venue.category)}
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                      {getCategoryIcon(venue.category)} {getCategoryLabel(venue.category)}
                    </span>
                  </div>
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-black">
                      {getPriceLabel(venue.price_range)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-1">
                      {venue.name}
                    </h3>
                    {venue.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium">{venue.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {venue.description || 'No description available'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{venue.city}</span>
                    </div>
                    {venue.address && (
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {venue.address}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
