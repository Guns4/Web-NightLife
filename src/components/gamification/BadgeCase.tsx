'use client';

import { motion } from 'framer-motion';

interface BadgeDisplay {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
  tier: string;
  earnedAt?: string;
}

interface BadgeCaseProps {
  badges: BadgeDisplay[];
  isLocked?: boolean;
}

const tierColors: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600',
};

const tierGlow: Record<string, string> = {
  bronze: 'shadow-amber-500/30',
  silver: 'shadow-gray-300/30',
  gold: 'shadow-yellow-400/50',
  platinum: 'shadow-purple-400/50',
};

const badgeIcons: Record<string, string> = {
  FIRST_DRINK: '🍺',
  CITY_EXPLORER: '🗺️',
  ELITE_REVIEWER: '⭐',
  NIGHT_OWL: '🦉',
  LOYAL_PATRON: '💎',
  PARTY_LEGEND: '🎉',
  FIRST_VISIT: '📍',
  CHECK_IN: '📝',
  STREAK_MASTER: '🔥',
  REFERRAL_CHAMPION: '🎁',
};

export function BadgeCase({ badges, isLocked = false }: BadgeCaseProps) {
  if (isLocked) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <span className="text-2xl opacity-20">🔒</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {badges.map((badge, index) => {
        const tier = tierColors[badge.tier] || tierColors.bronze;
        const glow = tierGlow[badge.tier] || tierGlow.bronze;
        const icon = badgeIcons[badge.code] || '🏅';

        return (
          <motion.div
            key={badge.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.1 }}
            className={`group relative aspect-square rounded-xl bg-gradient-to-br ${tier} p-0.5 cursor-pointer shadow-lg ${glow}`}
          >
            <div className="absolute inset-0 rounded-xl bg-black/80" />
            <div className="relative h-full w-full rounded-xl flex flex-col items-center justify-center p-1">
              <span className="text-2xl mb-1">{icon}</span>
              <span className="text-[8px] text-white/80 text-center leading-tight line-clamp-2">
                {badge.name}
              </span>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-black/95 border border-white/20 rounded-lg p-3 min-w-[150px] text-center">
                <p className="text-white font-bold text-xs">{badge.name}</p>
                <p className="text-white/60 text-[10px] mt-1">{badge.description}</p>
                {badge.earnedAt && (
                  <p className="text-yellow-400 text-[10px] mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="w-2 h-2 bg-black/95 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/20" />
            </div>
          </motion.div>
        );
      })}

      {/* Empty slots */}
      {[...Array(Math.max(0, 8 - badges.length))].map((_, i) => (
        <div
          key={`empty-${i}`}
          className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <span className="text-2xl opacity-20">?</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Badge Card for displaying in lists
 */
export function BadgeCard({ badge }: { badge: BadgeDisplay }) {
  const tier = tierColors[badge.tier] || tierColors.bronze;
  const glow = tierGlow[badge.tier] || tierGlow.bronze;
  const icon = badgeIcons[badge.code] || '🏅';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br ${tier} p-0.5 rounded-xl shadow-lg ${glow}`}
    >
      <div className="bg-black/90 rounded-xl p-4 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h4 className="text-white font-bold text-sm">{badge.name}</h4>
          <p className="text-white/60 text-xs">{badge.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Available Badges - Shows locked badges that can be earned
 */
export function AvailableBadges({ badges }: { badges: BadgeDisplay[] }) {
  return (
    <div className="space-y-2">
      {badges.map((badge) => {
        const icon = badgeIcons[badge.code] || '🏅';
        
        return (
          <div
            key={badge.id}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <span className="text-2xl grayscale opacity-50">{icon}</span>
            <div className="flex-1">
              <h4 className="text-white/60 font-medium text-sm">{badge.name}</h4>
              <p className="text-white/40 text-xs">{badge.description}</p>
            </div>
            <span className="text-xs text-white/30">🔒</span>
          </div>
        );
      })}
    </div>
  );
}

export default BadgeCase;
