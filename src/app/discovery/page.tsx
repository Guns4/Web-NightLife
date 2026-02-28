'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Star, Clock, ExternalLink } from 'lucide-react';
import NeonMap from '@/components/map/NeonMap';
import { SearchCardSkeleton, CategoryFilter } from '@/components/search/SearchComponents';
import { useDebounce, calculateDistance, formatDistance } from '@/lib/hooks/useSearch';

// Types
interface Venue {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  lat: number;
  lng: number;
  imageUrl?: string;
  isOpen?: boolean;
  priceLevel?: number;
  distance?: number;
}

const CATEGORIES = ['Nightclub', 'Bar', 'Speakeasy', 'Rooftop Bar', 'Live Music', 'Cocktail Bar'];

// Mock venues
const MOCK_VENUES: Venue[] = [
  { id: '1', name: 'Dragonfly', category: 'Nightclub', address: 'SCBD, Jakarta', rating: 4.5, lat: -6.1751, lng: 106.8650, isOpen: true, priceLevel: 3 },
  { id: '2', name: 'Blue Oak', category: 'Bar', address: 'Kemang, Jakarta', rating: 4.2, lat: -6.1760, lng: 106.8640, isOpen: true, priceLevel: 2 },
  { id: '3', name: 'The Vault', category: 'Speakeasy', address: 'Menteng, Jakarta', rating: 4.8, lat: -6.1740, lng: 106.8630, isOpen: false, priceLevel: 4 },
  { id: '4', name: 'Rooftop Garden', category: 'Rooftop Bar', address: 'Thamrin, Jakarta', rating: 4.6, lat: -6.1770, lng: 106.8660, isOpen: true, priceLevel: 3 },
  { id: '5', name: 'Jazz Corner', category: 'Live Music', address: 'Sudirman, Jakarta', rating: 4.3, lat: -6.1780, lng: 106.8670, isOpen: true, priceLevel: 2 },
  { id: '6', name: 'Cocktail Lab', category: 'Cocktail Bar', address: 'Senopati, Jakarta', rating: 4.7, lat: -6.1790, lng: 106.8680, isOpen: true, priceLevel: 3 },
];

export default function DiscoveryPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [hoveredVenueId, setHoveredVenueId] = useState<string | undefined>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = MOCK_VENUES;
      
      // Filter by query
      if (query) {
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(query.toLowerCase()) ||
          v.category.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Filter by categories
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(v => 
          selectedCategories.some(cat => v.category.includes(cat))
        );
      }
      
      // Calculate distances
      if (userLocation) {
        filtered = filtered.map(v => ({
          ...v,
          distance: calculateDistance(userLocation.lat, userLocation.lng, v.lat, v.lng),
        }));
      }
      
      setVenues(filtered);
      setLoading(false);
    };

    fetchVenues();
  }, [query, selectedCategories, userLocation]);

  // Handle map bounds change (search on map move)
  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    // In production, would fetch venues for this viewport
    console.log('Map bounds changed:', bounds);
  }, []);

  // Handle venue click
  const handleVenueClick = useCallback((venue: Venue) => {
    setSelectedVenueId(venue.id);
  }, []);

  // Handle marker click from map
  const handleMarkerClick = useCallback((venue: Venue) => {
    setSelectedVenueId(venue.id);
  }, []);

  // Handle get directions
  const handleGetDirections = (venue: Venue) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-obsidian">
      {/* Header */}
      <div className="border-b border-glass-border bg-dark-void/80 backdrop-blur-xl sticky top-[72px] z-40">
        <div className="container mx-auto px-4 py-4">
          {/* Categories */}
          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar - Venue List */}
        <div className="w-full md:w-[450px] lg:w-[500px] overflow-y-auto border-r border-glass-border">
          <div className="p-4 space-y-4">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {loading ? 'Searching...' : `${venues.length} venues found`}
              </h2>
              {userLocation && (
                <span className="text-xs text-neon-green flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Location enabled
                </span>
              )}
            </div>

            {/* Venue Cards */}
            {loading ? (
              <SearchCardSkeleton count={5} />
            ) : venues.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No venues found</h3>
                <p className="text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedVenueId(venue.id)}
                  onMouseEnter={() => setHoveredVenueId(venue.id)}
                  onMouseLeave={() => setHoveredVenueId(undefined)}
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedVenueId === venue.id
                      ? 'border-neon-cyan'
                      : hoveredVenueId === venue.id
                      ? 'border-neon-purple'
                      : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-dark-graphite flex-shrink-0 overflow-hidden">
                      {venue.imageUrl ? (
                        <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-white font-semibold truncate">{venue.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          venue.isOpen
                            ? 'bg-neon-green/20 text-neon-green'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {venue.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm">{venue.category}</p>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-neon-gold text-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {venue.rating.toFixed(1)}
                        </span>
                        {venue.distance !== undefined && (
                          <span className="text-neon-cyan text-sm">
                            {formatDistance(venue.distance)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {venue.address}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="hidden md:block flex-1">
          <NeonMap
            venues={venues}
            center={userLocation || undefined}
            zoom={13}
            onBoundsChange={handleBoundsChange}
            onMarkerClick={handleMarkerClick}
            selectedVenueId={selectedVenueId}
            hoveredVenueId={hoveredVenueId}
          />
        </div>
      </div>

      {/* Mobile Map Toggle */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center shadow-lg shadow-neon-cyan/30">
          <MapPin className="w-6 h-6 text-dark-obsidian" />
        </button>
      </div>
    </div>
  );
}
