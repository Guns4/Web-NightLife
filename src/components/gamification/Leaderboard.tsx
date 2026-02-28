'use client';

import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  level: number;
  xp: number;
  streak: number;
}

interface LeaderboardProps {
  leaders: LeaderboardEntry[];
  currentUserId?: string;
  city?: string;
  onCityChange?: (city: string | null) => void;
}

const cities = [
  'All',
  'Jakarta',
  'Bali',
  'Surabaya',
  'Bandung',
  'Yogyakarta',
];

export function Leaderboard({ leaders, currentUserId, city = 'All', onCityChange }: LeaderboardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'from-yellow-400 to-yellow-600', icon: '🥇', glow: 'shadow-yellow-400/50' };
      case 2:
        return { bg: 'from-gray-300 to-gray-500', icon: '🥈', glow: 'shadow-gray-300/50' };
      case 3:
        return { bg: 'from-amber-600 to-amber-800', icon: '🥉', glow: 'shadow-amber-600/50' };
      default:
        return { bg: 'from-white/10 to-white/5', icon: `${rank}`, glow: '' };
    }
  };

  return (
    <div className="space-y-4">
      {/* City Filter */}
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => onCityChange?.(c === 'All' ? null : c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              city === c || (c === 'All' && !city)
                ? 'bg-yellow-500 text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2 mb-6">
        {/* 2nd Place */}
        {leaders[1] && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              {leaders[1].avatarUrl ? (
                <img
                  src={leaders[1].avatarUrl}
                  alt={leaders[1].displayName || ''}
                  className="w-16 h-16 rounded-full border-4 border-gray-400 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-gray-400 bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">🥈</span>
            </div>
            <div className="bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-white font-bold text-sm truncate max-w-[80px]">
                {leaders[1].displayName || 'User'}
              </p>
              <p className="text-white/80 text-xs">Lv.{leaders[1].level}</p>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {leaders[0] && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              {leaders[0].avatarUrl ? (
                <img
                  src={leaders[0].avatarUrl}
                  alt={leaders[0].displayName || ''}
                  className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow-lg"
                  style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-3xl shadow-lg">
                  👑
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl">🥇</span>
            </div>
            <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-xl px-6 py-3 text-center min-w-[100px]">
              <p className="text-black font-bold text-sm truncate max-w-[100px]">
                {leaders[0].displayName || 'User'}
              </p>
              <p className="text-black/70 text-xs">Lv.{leaders[0].level}</p>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {leaders[2] && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              {leaders[2].avatarUrl ? (
                <img
                  src={leaders[2].avatarUrl}
                  alt={leaders[2].displayName || ''}
                  className="w-16 h-16 rounded-full border-4 border-amber-600 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">🥉</span>
            </div>
            <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-white font-bold text-sm truncate max-w-[80px]">
                {leaders[2].displayName || 'User'}
              </p>
              <p className="text-white/80 text-xs">Lv.{leaders[2].level}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Rest of Leaderboard */}
      <div className="space-y-2">
        {leaders.slice(3).map((leader, index) => {
          const isCurrentUser = leader.userId === currentUserId;
          
          return (
            <motion.div
              key={leader.userId}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isCurrentUser
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className="text-white/40 font-bold w-6 text-center">
                {leader.rank}
              </span>
              
              {leader.avatarUrl ? (
                <img
                  src={leader.avatarUrl}
                  alt={leader.displayName || ''}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  👤
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                  {leader.displayName || 'Anonymous'}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>Lv.{leader.level}</span>
                  {leader.city && <span>• {leader.city}</span>}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-yellow-400 font-bold">{leader.xp.toLocaleString()}</p>
                {leader.streak > 0 && (
                  <p className="text-xs text-orange-400">🔥 {leader.streak}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {leaders.length === 0 && (
        <div className="text-center py-8 text-white/40">
          No leaders yet. Be the first!
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
