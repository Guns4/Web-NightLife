/**
 * MOLECULE: VenueCard
 * Card component for displaying venue information
 */

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Users } from 'lucide-react';
import { Button } from '../atoms/Button';

export interface VenueCardProps {
  id: string;
  name: string;
  category: string;
  city: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: number;
  imageUrl?: string;
  isVerified?: boolean;
  isBoosted?: boolean;
  distance?: number;
  onBookmark?: () => void;
}

export function VenueCard({
  id,
  name,
  category,
  city,
  address,
  rating = 0,
  reviewCount = 0,
  priceRange = 1,
  imageUrl,
  isVerified = false,
  isBoosted = false,
  distance,
  onBookmark,
}: VenueCardProps) {
  const priceDisplay = 'Rp '.padEnd(priceRange + 2, '$');

  return (
    <Link href={'/venue/' + id}>
      <div className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isBoosted && (
              <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                BOOSTED
              </span>
            )}
            {isVerified && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                ✓ Verified
              </span>
            )}
          </div>
          
          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full capitalize">
              {category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-1">
              {name}
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {address || city}
              {distance && ` • ${distance}m away`}
            </span>
          </div>

          {/* Rating & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-white">
                  {rating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500 text-sm">
                ({reviewCount} reviews)
              </span>
            </div>
            
            <span className="text-yellow-500 font-medium">
              {priceDisplay}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
