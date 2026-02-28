'use client';

import { motion } from 'framer-motion';

interface GlowProgressBarProps {
  currentXp: number;
  maxXp: number;
  level: number;
  showLabel?: boolean;
}

export function GlowProgressBar({ 
  currentXp, 
  maxXp, 
  level,
  showLabel = true 
}: GlowProgressBarProps) {
  const percentage = Math.min((currentXp / maxXp) * 100, 100);

  return (
    <div className="w-full">
      {/* Level Badge */}
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-lg">Lv.{level}</span>
            <span className="text-white/60 text-sm">Level {level}</span>
          </div>
          <span className="text-white/40 text-sm">
            {currentXp} / {maxXp} XP
          </span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
        
        {/* Progress Bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
          }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />
      </div>

      {/* XP Info */}
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/40">Current XP</span>
          <span className="text-xs text-yellow-400/80">
            {maxXp - currentXp} XP to Level {level + 1}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Streak Display Component
 */
export function StreakDisplay({ streakDays, longestStreak }: { streakDays: number; longestStreak: number }) {
  return (
    <div className="flex items-center gap-3">
      {/* Fire Icon with Glow */}
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <span className="text-2xl">🔥</span>
        </motion.div>
        {streakDays > 0 && (
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
            }}
          />
        )}
      </div>

      {/* Streak Info */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-orange-400">{streakDays}</span>
          <span className="text-sm text-white/60">day streak</span>
        </div>
        <div className="text-xs text-white/40">
          Best: {longestStreak} days
        </div>
      </div>
    </div>
  );
}

export default GlowProgressBar;
