'use client';

/**
 * Leaderboards Component
 * Phase 4.4: Social Ecosystem - Global & Local Rankings
 * 
 * Features:
 * - Top Trendsetter ranking
 * - The Mayor (venue-specific)
 * - Social Magnet ranking
 * - Neon glow effects
 * - God Mode badge for Mayors
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Users, 
  Flame, 
  MapPin,
  TrendingUp,
  Zap,
  Medal,
  Sparkles
} from 'lucide-react';

// Types
interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  score: number;
  badge?: string;
  is_mayor?: boolean;
}

// Mock data for demo
const mockTrendsetters: LeaderboardEntry[] = [
  { rank: 1, user_id: '1', user_name: 'Sarah Wijaya', avatar_url: null, score: 89, badge: '🔥' },
  { rank: 2, user_id: '2', user_name: 'Ahmad Rizki', avatar_url: null, score: 76, badge: '⭐' },
  { rank: 3, user_id: '3', user_name: 'Jessica Lee', avatar_url: null, score: 65 },
  { rank: 4, user_id: '4', user_name: 'Budi Santoso', avatar_url: null, score: 54 },
  { rank: 5, user_id: '5', user_name: 'Michael Chen', avatar_url: null, score: 48 },
];

const mockMayors: LeaderboardEntry[] = [
  { rank: 1, user_id: '2', user_name: 'Ahmad Rizki', avatar_url: null, score: 156, is_mayor: true },
  { rank: 2, user_id: '1', user_name: 'Sarah Wijaya', avatar_url: null, score: 142, is_mayor: true },
  { rank: 3, user_id: '6', user_name: 'David Wong', avatar_url: null, score: 98 },
  { rank: 4, user_id: '7', user_name: 'Lisa Tan', avatar_url: null, score: 87 },
  { rank: 5, user_id: '8', user_name: 'Kevin Lee', avatar_url: null, score: 76 },
];

const mockSocialMagnets: LeaderboardEntry[] = [
  { rank: 1, user_id: '1', user_name: 'Sarah Wijaya', avatar_url: null, score: 234 },
  { rank: 2, user_id: '3', user_name: 'Jessica Lee', avatar_url: null, score: 198 },
  { rank: 3, user_id: '9', user_name: 'Rina Putri', avatar_url: null, score: 176 },
  { rank: 4, user_id: '10', user_name: 'Doni Prasetyo', avatar_url: null, score: 154 },
  { rank: 5, user_id: '11', user_name: 'Anita Dewi', avatar_url: null, score: 132 },
];

const RANKING_CATEGORIES = [
  { id: 'top_trendsetter', label: 'Top Trendsetter', icon: Flame, color: '#FF6B35' },
  { id: 'mayor', label: 'The Mayor', icon: Crown, color: '#FFD700' },
  { id: 'social_magnet', label: 'Social Magnet', icon: Users, color: '#C026D3' },
];

export default function Leaderboards() {
  const [activeCategory, setActiveCategory] = useState('top_trendsetter');
  
  const getLeaderboardData = () => {
    switch (activeCategory) {
      case 'mayor': return mockMayors;
      case 'social_magnet': return mockSocialMagnets;
      default: return mockTrendsetters;
    }
  };

  const currentCategory = RANKING_CATEGORIES.find(c => c.id === activeCategory);
  const leaderboardData = getLeaderboardData();

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {RANKING_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              style={isActive ? {
                boxShadow: `0 0 20px ${category.color}40`
              } : {}}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? category.color : undefined }} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {/* Top 3 Podium */}
        {leaderboardData.slice(0, 3).map((entry, index) => {
          const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          const isFirst = index === 0;
          
          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-2xl border ${
                isFirst 
                  ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-yellow-500/50' 
                  : 'bg-white/5 border-white/10'
              }`}
              style={isFirst ? {
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)'
              } : {}}
            >
              {/* Rank Badge */}
              <div 
                className="absolute -top-3 -left-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
                style={{ backgroundColor: podiumColors[index] }}
              >
                {entry.rank}
              </div>

              {/* Glow effect for first place */}
              {isFirst && (
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.3)',
                      '0 0 40px rgba(255, 215, 0, 0.5)',
                      '0 0 20px rgba(255, 215, 0, 0.3)'
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                />
              )}

              <div className="flex items-center gap-4 ml-4">
                {/* Avatar */}
                <div className="relative">
                  <div 
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${
                      isFirst 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                        : 'bg-white/10'
                    }`}
                  >
                    {entry.user_name[0]}
                  </div>
                  {entry.is_mayor && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Crown className="w-3 h-3 text-black" />
                    </div>
                  )}
                  {entry.badge && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center text-sm">
                      {entry.badge}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{entry.user_name}</h3>
                    {isFirst && (
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-white/50">
                    {activeCategory === 'mayor' && entry.is_mayor ? '👑 Venue Mayor' : 
                     activeCategory === 'top_trendsetter' ? `${entry.score} venues discovered` :
                     `${entry.score} invites accepted`}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xl font-bold" style={{ color: currentCategory?.color }}>
                    <Zap className="w-5 h-5" />
                    {entry.score.toLocaleString()}
                  </div>
                  <p className="text-xs text-white/40">points</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Rest of rankings */}
        {leaderboardData.slice(3).map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-8 text-center font-bold text-white/40">
              {entry.rank}
            </div>

            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-medium text-white/80">
              {entry.user_name[0]}
            </div>

            <div className="flex-1">
              <h3 className="font-medium text-white">{entry.user_name}</h3>
              <p className="text-xs text-white/40">
                {entry.score} points
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 font-bold text-white/60">
                <Zap className="w-4 h-4" />
                {entry.score}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User's Rank Banner */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center font-bold">
              12
            </div>
            <div>
              <p className="font-bold text-white">Your Ranking</p>
              <p className="text-sm text-white/60">You're in the top 15%</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
