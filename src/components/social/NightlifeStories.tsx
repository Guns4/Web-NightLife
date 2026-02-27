'use client';

/**
 * Nightlife Stories Component
 * Phase 4.4: Social Ecosystem - Live Moments
 * 
 * Features:
 * - Story circle at top of home page
 * - Verified stories only (from check-ins)
 * - 12-hour expiry
 * - Active glow for live stories
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  X, 
  Eye, 
  Sparkles, 
  MapPin,
  Clock,
  Verified
} from 'lucide-react';

// Types
interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string;
  expires_at: string;
  is_verified: boolean;
  view_count: number;
  user: {
    full_name: string;
    avatar_url: string | null;
    level: number;
  };
  venue: {
    name: string;
  } | null;
}

// Mock data for demo
const mockStories: Story[] = [
  {
    id: '1',
    user_id: 'user1',
    media_url: '/videos/story1.mp4',
    media_type: 'video',
    thumbnail_url: '',
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    is_verified: true,
    view_count: 45,
    user: { full_name: 'Sarah Wijaya', avatar_url: null, level: 22 },
    venue: { name: 'Dragonfly Club' }
  },
  {
    id: '2',
    user_id: 'user2',
    media_url: '/videos/story2.mp4',
    media_type: 'video',
    thumbnail_url: '',
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    is_verified: true,
    view_count: 128,
    user: { full_name: 'Budi Santoso', avatar_url: null, level: 15 },
    venue: { name: 'Kama Club' }
  },
  {
    id: '3',
    user_id: 'user3',
    media_url: '/videos/story3.mp4',
    media_type: 'video',
    thumbnail_url: '',
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    is_verified: true,
    view_count: 67,
    user: { full_name: 'Jessica Lee', avatar_url: null, level: 28 },
    venue: { name: 'Colosseum' }
  }
];

export default function NightlifeStories() {
  const [stories] = useState<Story[]>(mockStories);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Active story timer
  useEffect(() => {
    if (!activeStory || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          const currentIndex = stories.findIndex(s => s.id === activeStory.id);
          if (currentIndex < stories.length - 1) {
            setActiveStory(stories[currentIndex + 1]);
          } else {
            setActiveStory(null);
          }
          return 0;
        }
        return prev + 2; // Complete in ~50 seconds (15 second video)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, isPaused, stories]);

  // Format time remaining
  const formatTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="w-full">
      {/* Story Circle */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1 min-w-[70px]">
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center border-2 border-black">
              <span className="text-xs">+</span>
            </div>
          </div>
          <span className="text-xs text-white/60">Your Story</span>
        </div>

        {/* Story Items */}
        {stories.map((story) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-1 min-w-[70px]"
          >
            {/* Story Ring */}
            <div className="relative">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(192, 38, 211, 0)',
                    '0 0 0 3px rgba(192, 38, 211, 0.4)',
                    '0 0 0 0px rgba(192, 38, 211, 0)'
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500"
              >
                <div className="w-full h-full rounded-full bg-black overflow-hidden">
                  {story.thumbnail_url ? (
                    <img 
                      src={story.thumbnail_url} 
                      alt={story.user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white/40">
                        {story.user.full_name[0]}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Verified Badge */}
              {story.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-black">
                  <Verified className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Username */}
            <span className="text-xs text-white/80 truncate max-w-[60px]">
              {story.user.full_name.split(' ')[0]}
            </span>
            
            {/* Time */}
            <span className="text-[10px] text-white/40">
              {formatTimeRemaining(story.expires_at)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Active Story Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => setActiveStory(null)}
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.slice(0, stories.findIndex(s => s.id === activeStory.id) + 1).map((s, i) => (
                <div 
                  key={s.id}
                  className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                >
                  <div 
                    className="h-full bg-white"
                    style={{ 
                      width: s.id === activeStory.id ? `${progress}%` : '100%' 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full max-w-lg aspect-[9/16] bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Video/Image Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/20 to-black">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center mb-4"
                    >
                      <Play className="w-10 h-10 text-white ml-1" />
                    </motion.div>
                    <p className="text-white/60 text-sm">Live from {activeStory.venue?.name}</p>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center font-bold">
                    {activeStory.user.full_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{activeStory.user.full_name}</span>
                      {activeStory.is_verified && (
                        <Verified className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <MapPin className="w-3 h-3" />
                      <span>{activeStory.venue?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs text-white/60">
                    <Eye className="w-3 h-3" />
                    {activeStory.view_count}
                  </div>
                  <button
                    onClick={() => setActiveStory(null)}
                    className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-8 left-4 right-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6 text-white" />
                    ) : (
                      <Pause className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-center text-xs text-white/40 mt-4">
                  Tap to {isPaused ? 'play' : 'pause'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
