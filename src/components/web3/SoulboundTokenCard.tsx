'use client';

/**
 * Soulbound Token (SBT) Card Component
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Features:
 * - Display reputation score and tier
 * - Show achievements
 * - ZKP verification status
 * - DID display
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BadgeCheck, 
  Award, 
  Shield, 
  Lock,
  Globe,
  Star,
  Crown,
  Sparkles,
  Fingerprint,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { SBT_CONFIG, generateDID, getTierFromScore } from '@/lib/contracts/soulbound-token';

interface SoulboundTokenCardProps {
  walletAddress?: string;
  reputationScore?: number;
  achievements?: Achievement[];
  verifications?: Record<string, boolean>;
  onVerify?: (verificationType: string) => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  progress?: number;
}

// Mock data
const mockAchievements: Achievement[] = [
  { 
    id: 'first_steps', 
    name: 'First Steps', 
    description: 'Complete your first check-in',
    icon: 'footsteps',
    points: 10,
    unlockedAt: new Date('2024-01-15'),
  },
  { 
    id: 'social_butterfly', 
    name: 'Social Butterfly', 
    description: 'Visit 10 different venues',
    icon: 'butterfly',
    points: 50,
    progress: 70,
  },
  { 
    id: 'night_owl', 
    name: 'Night Owl', 
    description: 'Check-in 50 times',
    icon: 'owl',
    points: 100,
    progress: 32,
  },
  { 
    id: 'influencer', 
    name: 'Influencer', 
    description: 'Refer 5 friends who join',
    icon: 'star',
    points: 75,
    unlockedAt: new Date('2024-02-01'),
  },
];

const mockVerifications = {
  age_21_plus: true,
  platinum_status: false,
  resident: true,
};

export default function SoulboundTokenCard({
  walletAddress = '0x1234...5678',
  reputationScore = 350,
  achievements = mockAchievements,
  verifications = mockVerifications,
  onVerify,
}: SoulboundTokenCardProps) {
  const [showFullDID, setShowFullDID] = useState(false);
  
  const tier = getTierFromScore(reputationScore);
  const did = generateDID(walletAddress);
  
  const tierConfig = {
    newcomer: { color: '#888888', icon: Star, name: 'Newcomer' },
    regular: { color: '#CD7F32', icon: BadgeCheck, name: 'Regular' },
    influencer: { color: '#C0C0C0', icon: Award, name: 'Influencer' },
    vip: { color: '#FFD700', icon: Crown, name: 'VIP' },
    legend: { color: '#E5E4E2', icon: Sparkles, name: 'Legend' },
  };
  
  const config = tierConfig[tier as keyof typeof tierConfig];
  const TierIcon = config.icon;
  
  const getAchievementIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      footprints: Star,
      butterfly: Star,
      owl: Star,
      star: Star,
      diamond: Crown,
      rocket: Zap,
      trophy: Award,
      globe: Globe,
      calendar: Clock,
      crown: Crown,
    };
    return icons[iconName] || Award;
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      {/* SBT Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${config.color}22 0%, ${config.color}44 100%)`,
          border: `1px solid ${config.color}44`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${config.color} 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${config.color}33` }}
              >
                <TierIcon className="w-6 h-6" style={{ color: config.color }} />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Soulbound Token</p>
                <p className="font-bold text-lg" style={{ color: config.color }}>
                  {config.name}
                </p>
              </div>
            </div>
            <Lock className="w-5 h-5 text-white/40" />
          </div>
          
          {/* DID */}
          <div className="mb-6">
            <p className="text-white/40 text-xs mb-1">Decentralized ID</p>
            <button
              onClick={() => setShowFullDID(!showFullDID)}
              className="text-white/80 font-mono text-sm hover:text-white transition-colors"
            >
              {showFullDID ? did : did.slice(0, 20) + '...'}
            </button>
          </div>
          
          {/* Reputation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-sm">Reputation Score</p>
              <p className="text-white font-bold">{reputationScore} / 1000</p>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${reputationScore / 10}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: config.color }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>
          
          {/* Verifications */}
          <div className="mb-6">
            <p className="text-white/60 text-xs mb-2">Privacy Verifications (ZKP)</p>
            <div className="space-y-2">
              {Object.entries(verifications).map(([key, isVerified]) => {
                const zkpConfig = SBT_CONFIG.zkpVerification[key as keyof typeof SBT_CONFIG.zkpVerification];
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className={`w-4 h-4 ${isVerified ? 'text-green-400' : 'text-white/40'}`} />
                      <span className="text-white/80 text-sm">{zkpConfig?.name || key}</span>
                    </div>
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => onVerify?.(key)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div 
          className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl -z-10"
          style={{ backgroundColor: config.color }}
        />
      </motion.div>
      
      {/* Achievements Section */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">Achievements</h3>
          <span className="text-white/40 text-sm">
            ({achievements.filter(a => a.unlockedAt).length}/{achievements.length})
          </span>
        </div>
        
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const Icon = getAchievementIcon(achievement.icon);
            const isUnlocked = !!achievement.unlockedAt;
            const progress = achievement.progress || 0;
            
            return (
              <div 
                key={achievement.id}
                className={`p-3 rounded-xl ${
                  isUnlocked 
                    ? 'bg-yellow-500/10 border border-yellow-500/20' 
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isUnlocked ? 'bg-yellow-500/20' : 'bg-white/10'
                      }`}
                    >
                      <Icon 
                        className={`w-5 h-5 ${isUnlocked ? 'text-yellow-400' : 'text-white/40'}`} 
                      />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
                        {achievement.name}
                      </p>
                      <p className="text-xs text-white/40">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isUnlocked ? (
                      <span className="text-yellow-400 text-sm font-medium">
                        +{achievement.points}
                      </span>
                    ) : (
                      <div className="w-20">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-1">{progress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
