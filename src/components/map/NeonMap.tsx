'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Navigation, Star, ExternalLink, MapPin } from 'lucide-react';

// =====================================================
// CYBERPUNK MAP STYLING
// =====================================================

const CYBERPUNK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#93817c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
  // Neon accents for POIs
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a24' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ color: '#00f5ff' }],
  },
];

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
}

interface NeonMapProps {
  venues: Venue[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onMarkerClick?: (venue: Venue) => void;
  selectedVenueId?: string;
  hoveredVenueId?: string;
}

interface MarkerWithVenue {
  marker: google.maps.marker.AdvancedMarkerElement;
  venue: Venue;
}

// =====================================================
// PULSING MARKER COMPONENT
// =====================================================

function createNeonMarkerElement(venue: Venue, isSelected: boolean, isHovered: boolean): HTMLElement {
  const container = document.createElement('div');
  container.className = 'neon-marker';
  container.style.cssText = `
    position: relative;
    width: 40px;
    height: 40px;
    cursor: pointer;
  `;

  // Pulsing outer ring
  if (isSelected || isHovered) {
    const pulseRing = document.createElement('div');
    pulseRing.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${isSelected ? 'rgba(0, 245, 255, 0.3)' : 'rgba(191, 0, 255, 0.3)'};
      animation: pulse 1.5s ease-out infinite;
    `;
    container.appendChild(pulseRing);
  }

  // Main marker
  const marker = document.createElement('div');
  marker.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    background: ${isSelected ? 'var(--neon-cyan)' : isHovered ? 'var(--neon-purple)' : 'var(--neon-pink)'};
    border-radius: 50% 50% 50% 0;
    transform: translate(-50%, -50%) rotate(-45deg);
    box-shadow: 0 0 10px ${isSelected ? 'var(--neon-cyan)' : isHovered ? 'var(--neon-purple)' : 'var(--neon-pink)'},
                0 0 20px ${isSelected ? 'var(--neon-cyan)' : isHovered ? 'var(--neon-purple)' : 'var(--neon-pink)'};
    border: 2px solid white;
  `;
  container.appendChild(marker);

  // Add animation styles if not already present
  if (!document.getElementById('marker-animations')) {
    const style = document.createElement('style');
    style.id = 'marker-animations';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  return container;
}

// =====================================================
// CUSTOM INFOWINDOW
// =====================================================

function createInfoWindowContent(venue: Venue): string {
  const ratingStars = '★'.repeat(Math.floor(venue.rating)) + '☆'.repeat(5 - Math.floor(venue.rating));

  return `
    <div class="map-infowindow" style="
      background: rgba(18, 18, 26, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      min-width: 200px;
      font-family: system-ui, sans-serif;
    ">
      <div style="display: flex; gap: 12px;">
        <div style="
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background: ${venue.imageUrl ? `url(${venue.imageUrl})` : '#1a1a24'};
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        "></div>
        <div>
          <h3 style="
            margin: 0 0 4px 0;
            color: white;
            font-size: 16px;
            font-weight: 600;
          ">${venue.name}</h3>
          <p style="
            margin: 0 0 4px 0;
            color: #a0a0b0;
            font-size: 12px;
          ">${venue.category}</p>
          <div style="
            color: #ffd700;
            font-size: 12px;
          ">${ratingStars} ${venue.rating.toFixed(1)}</div>
        </div>
      </div>
      <div style="
        display: flex;
        gap: 8px;
        margin-top: 12px;
      ">
        <button onclick="window.open('/venue/${venue.id}', '_blank')" style="
          flex: 1;
          padding: 8px 12px;
          background: linear-gradient(135deg, #00f5ff, #bf00ff);
          border: none;
          border-radius: 6px;
          color: #0a0a0f;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        ">Book Now</button>
        <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}', '_blank')" style="
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-size: 12px;
        ">Directions</button>
      </div>
    </div>
  `;
}

// =====================================================
// MAIN MAP COMPONENT
// =====================================================

export default function NeonMap({
  venues,
  center = { lat: -6.1751, lng: 106.8650 }, // Jakarta
  zoom = 13,
  onBoundsChange,
  onMarkerClick,
  selectedVenueId,
  hoveredVenueId,
}: NeonMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerWithVenue[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['marker', 'places'],
      });

      const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      if (!mapRef.current) return;

      const mapInstance = new Map(mapRef.current, {
        center,
        zoom,
        styles: CYBERPUNK_MAP_STYLE as google.maps.MapTypeStyle[],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        backgroundColor: '#0a0a0a',
      });

      // Create InfoWindow
      const infoWindowInstance = new google.maps.InfoWindow({
        content: '',
        disableAutoPan: true,
      });

      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);
      setInfoWindow(infoWindowInstance);

      // Handle idle event for search on map move
      mapInstance.addListener('idle', () => {
        const bounds = mapInstance.getBounds();
        if (bounds && onBoundsChange) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChange({
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
          });
        }
      });
    };

    initMap();
  }, []);

  // Update markers when venues change
  useEffect(() => {
    if (!map) return;

    const updateMarkers = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

      // Clear existing markers
      markers.forEach(({ marker }) => {
        marker.map = null;
      });

      // Create new markers
      const newMarkers: MarkerWithVenue[] = venues.map((venue) => {
        const isSelected = venue.id === selectedVenueId;
        const isHovered = venue.id === hoveredVenueId;

        const markerElement = createNeonMarkerElement(venue, isSelected, isHovered);

        const marker = new AdvancedMarkerElement({
          position: { lat: venue.lat, lng: venue.lng },
          map,
          title: venue.name,
          content: markerElement,
        });

        // Click handler
        marker.addListener('click', () => {
          if (infoWindow && map) {
            infoWindow.setContent(createInfoWindowContent(venue));
            infoWindow.setPosition({ lat: venue.lat, lng: venue.lng });
            infoWindow.open(map);
          }
          onMarkerClick?.(venue);
        });

        return { marker, venue };
      });

      setMarkers(newMarkers);
    };

    updateMarkers();
  }, [map, venues, selectedVenueId, hoveredVenueId, infoWindow, onMarkerClick]);

  // Pan to selected venue
  useEffect(() => {
    if (!map || !selectedVenueId) return;

    const marker = markers.find(m => m.venue.id === selectedVenueId);
    if (marker) {
      map.panTo({ lat: marker.venue.lat, lng: marker.venue.lng });
      map.setZoom(15);
    }
  }, [map, selectedVenueId, markers]);

  // Pan to hovered venue
  useEffect(() => {
    if (!map || !hoveredVenueId) return;

    const marker = markers.find(m => m.venue.id === hoveredVenueId);
    if (marker && marker.venue.id !== selectedVenueId) {
      map.panTo({ lat: marker.venue.lat, lng: marker.venue.lng });
    }
  }, [map, hoveredVenueId, markers, selectedVenueId]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Map Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => map?.setZoom((map.getZoom() || 13) + 1)}
          className="w-10 h-10 glass-card flex items-center justify-center text-white hover:text-neon-cyan transition-colors"
        >
          +
        </button>
        <button
          onClick={() => map?.setZoom((map.getZoom() || 13) - 1)}
          className="w-10 h-10 glass-card flex items-center justify-center text-white hover:text-neon-cyan transition-colors"
        >
          -
        </button>
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  map?.panTo({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                },
                (error) => console.error('Geolocation error:', error)
              );
            }
          }}
          className="w-10 h-10 glass-card flex items-center justify-center text-neon-green hover:text-white transition-colors"
          title="My Location"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
