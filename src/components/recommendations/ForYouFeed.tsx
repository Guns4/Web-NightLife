/**
 * =====================================================
 * FOR YOU FEED COMPONENT
 * AfterHoursID - AI-Powered Recommendations
 * =====================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Venue {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  price_range: string;
  rating: number;
  images: string[];
}

interface APIResponse {
  success: boolean;
  error?: string;
  venues?: Venue[];
  reason?: string;
  algorithm?: string;
}

interface ForYouFeedProps {
  userId?: string;
  city?: string;
  limit?: number;
}

export default function ForYouFeed({ userId, city, limit = 10 }: ForYouFeedProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [algorithm, setAlgorithm] = useState('');
  const [error, setError] = useState('');

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (city) params.append('city', city);
      params.append('limit', limit.toString());
      
      const res = await fetch(`/api/recommendations/for-you?${params}`);
      const data: APIResponse = await res.json();
      
      if (data.success && data.venues) {
        setVenues(data.venues);
        setReason(data.reason || '');
        setAlgorithm(data.algorithm || '');
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, city, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleInteraction = async (venueId: string, action: string) => {
    if (!userId) return;
    
    try {
      await fetch('/api/recommendations/for-you', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          venue_id: venueId,
          action,
        }),
      });
      
      if (action === 'hide') {
        setVenues(venues.filter(v => v.id !== venueId));
      }
    } catch (err) {
      console.error('Failed to record interaction:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-4 px-4 py-2 bg-gold-500 text-black rounded hover:bg-gold-400"
        >
          Retry
        </button>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">No recommendations available yet.</p>
        <p className="text-sm text-gray-500 mt-2">Start exploring venues to get personalized picks!</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-2xl font-bold text-white">For You</h2>
        </div>
        <p className="text-gray-400 text-sm">
          {reason} • Powered by AI ({algorithm})
        </p>
      </div>

      {/* Venue Cards */}
      <div className="space-y-4">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group"
          >
            <div className="flex">
              {/* Image */}
              <div className="w-32 h-32 flex-shrink-0">
                {venue.images[0] ? (
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl">🎉</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {venue.category} • {venue.city} • {venue.price_range}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gold-400">
                    <span>⭐</span>
                    <span className="font-medium">{venue.rating}</span>
                  </div>
                </div>
                
                {/* Actions */}
                {userId && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleInteraction(venue.id, 'like')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500"
                    >
                      ❤️ Like
                    </button>
                    <button
                      onClick={() => handleInteraction(venue.id, 'book')}
                      className="px-3 py-1 text-xs bg-gold-500 text-black rounded hover:bg-gold-400"
                    >
                      📅 Book
                    </button>
                    <button
                      onClick={() => handleInteraction(venue.id, 'hide')}
                      className="px-3 py-1 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
                    >
                      🚫 Not Interested
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchRecommendations}
          className="text-gold-400 hover:text-gold-300 text-sm"
        >
          🔄 Refresh Recommendations
        </button>
      </div>
    </div>
  );
}
