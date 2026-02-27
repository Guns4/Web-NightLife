'use client';

/**
 * VibeMatch Feed Component
 * Phase 5: AI Recommendation Engine - "For You" Section
 * 
 * Features:
 * - Personalized venue recommendations
 * - Match percentage with reasons
 * - Friend activity overlay
 * - Real-time scoring
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Music, 
  ChevronRight,
  Heart,
  Star
} from 'lucide-react';

// Types
interface VenueMatch {
  venue_id: string;
  venue_name: string;
  venue_image: string;
  match_score: number;
  match_reason: string;
  music_match: number;
  social_match: number;
  proximity_match: number;
}

// Mock data for demo
const mockMatches: VenueMatch[] = [
  {
    venue_id: '1',
    venue_name: 'Dragonfly Club',
    venue_image: '',
    match_score: 98,
    match_reason: '4 friends here & they play Techno',
    music_match: 95,
    social_match: 100,
    proximity_match: 85
  },
  {
    venue_id: '2',
    venue_name: 'Kama Club',
    venue_image: '',
    match_score: 92,
    match_reason: 'Your favorite genre RnB is playing tonight',
    music_match: 90,
    social_match: 60,
    proximity_match: 95
  },
  {
    venue_id: '3',
    venue_name: 'Colosseum',
    venue_image: '',
    match_score: 87,
    match_reason: 'Top rated by people with your taste',
    music_match: 80,
    social_match: 75,
    proximity_match: 90
  },
  {
    venue_id: '4',
    venue_name: 'Vault Nightclub',
    venue_image: '',
    match_score: 82,
    match_reason: 'New venue matching your vibe',
    music_match: 85,
    social_match: 40,
    proximity_match: 88
  },
  {
    venue_id: '5',
    venue_name: 'X2O Club',
    venue_image: '',
    match_score: 78,
    match_reason: 'Popular with your circle tonight',
    music_match: 75,
    social_match: 65,
    proximity_match: 92
  }
];

export default function VibeMatchFeed() {
  const [matches] = useState<VenueMatch[]>(mockMatches);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-fuchsia-400';
    return 'text-yellow-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-transparent';
    if (score >= 75) return 'from-fuchsia-500/20 to-transparent';
    return 'from-yellow-500/20 to-transparent';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white">For You</h2>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fuchsia-400" />
          <h2 className="text-xl font-bold text-white">For You</h2>
        </div>
        <button className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1">
          See All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {matches.map((venue, index) => (
          <motion.div
            key={venue.venue_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group hover:border-fuchsia-500/30 transition-all"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${getScoreGradient(venue.match_score)} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="relative flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-fuchsia-600/30 to-purple-600/30 flex items-center justify-center flex-shrink-0">
                <Music className="w-8 h-8 text-white/50" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white truncate">{venue.venue_name}</h3>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{venue.match_reason}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-2xl font-bold ${getScoreColor(venue.match_score)}`}>
                    {venue.match_score}%
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Music className="w-3 h-3" />
                    <span>{venue.music_match}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Users className="w-3 h-3" />
                    <span>{venue.social_match}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <MapPin className="w-3 h-3" />
                    <span>{venue.proximity_match}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button className="flex-1 py-2 rounded-lg bg-fuchsia-600/20 text-fuchsia-400 text-sm font-medium hover:bg-fuchsia-600/30 transition-colors">
                View Details
              </button>
              <button className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20">
                <Heart className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20">
                <Star className="w-4 h-4" />
              </button>
            </div>

            {venue.match_score >= 90 && (
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 0 0px rgba(34, 197, 94, 0)',
                    '0 0 20px 2px rgba(34, 197, 94, 0.3)',
                    '0 0 0 0px rgba(34, 197, 94, 0)'
                  ]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center py-4">
        <button className="px-6 py-2 rounded-full bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors">
          Load More Recommendations
        </button>
      </div>
    </div>
  );
}
