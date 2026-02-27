'use client';

/**
 * VIBE Token Dashboard Component
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Features:
 * - Display token balance
 * - Staking positions
 * - Earn/Spend actions
 * - Transaction history
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  TrendingUp, 
  Wallet, 
  Gift, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Lock,
  Zap,
  Users,
  Star,
  Calendar,
  Trophy
} from 'lucide-react';
import { VIBE_TOKEN_CONFIG, EARN_VIBE_ACTIONS, SPEND_VIBE_ACTIONS } from '@/lib/contracts/vibe-token';

interface VIBETokenDashboardProps {
  balance?: number;
  stakedTotal?: number;
  pendingRewards?: number;
  onStake?: (venueId: string, amount: number) => void;
  onUnstake?: (positionId: string) => void;
  onClaimRewards?: () => void;
  onEarnAction?: (actionId: string) => void;
  onSpendAction?: (actionId: string) => void;
}

// Mock data
const mockTransactions = [
  { type: 'earned', amount: 10, description: 'Verified check-in', date: '2 hours ago' },
  { type: 'spent', amount: 50, description: 'Booking deposit', date: '1 day ago' },
  { type: 'reward', amount: 25, description: 'Staking rewards', date: '2 days ago' },
  { type: 'earned', amount: 50, description: 'Quality review', date: '3 days ago' },
];

const mockStakingPositions = [
  { id: '1', venueName: 'Club XYZ', amount: 500, pendingRewards: 25, multiplier: 2, lockEnds: '5 days' },
  { id: '2', venueName: 'Lounge ABC', amount: 250, pendingRewards: 10, multiplier: 1, lockEnds: '2 days' },
];

export default function VIBETokenDashboard({
  balance = 1250,
  stakedTotal = 750,
  pendingRewards = 35,
  onStake,
  onUnstake,
  onClaimRewards,
  onEarnAction,
  onSpendAction,
}: VIBETokenDashboardProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'stake' | 'earn' | 'spend'>('balance');
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          <span className="text-yellow-400">$VIBE</span> Token
        </h2>
        <p className="text-white/60">Your loyalty rewards, now on-chain</p>
      </div>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Coins className="w-8 h-8 text-yellow-400" />
            <span className="text-yellow-400/60 text-xs">Available</span>
          </div>
          <p className="text-3xl font-bold text-white">{balance.toLocaleString()}</p>
          <p className="text-white/60 text-sm">$VIBE Tokens</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
            <span className="text-purple-400/60 text-xs">Staked</span>
          </div>
          <p className="text-3xl font-bold text-white">{stakedTotal.toLocaleString()}</p>
          <p className="text-white/60 text-sm">$VIBE Staked</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-green-400" />
            <span className="text-green-400/60 text-xs">Pending</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingRewards.toLocaleString()}</p>
          <p className="text-white/60 text-sm">$VIBE Rewards</p>
          <button
            onClick={onClaimRewards}
            className="mt-3 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-colors"
          >
            Claim All
          </button>
        </motion.div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'balance', label: 'Transactions', icon: Wallet },
          { id: 'stake', label: 'Staking', icon: TrendingUp },
          { id: 'earn', label: 'Earn', icon: Gift },
          { id: 'spend', label: 'Spend', icon: ShoppingCart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            {mockTransactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'earned' || tx.type === 'reward'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.type === 'earned' || tx.type === 'reward' ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-white/40 text-sm">{tx.date}</p>
                  </div>
                </div>
                <p className={`font-bold ${
                  tx.type === 'earned' || tx.type === 'reward'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {tx.type === 'earned' || tx.type === 'reward' ? '+' : '-'}{tx.amount} $VIBE
                </p>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'stake' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Staking Positions</h3>
              <button className="px-4 py-2 rounded-xl bg-yellow-500 text-gray-900 text-sm font-medium hover:bg-yellow-400 transition-colors">
                Stake More
              </button>
            </div>
            {mockStakingPositions.map((position) => (
              <div key={position.id} className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">{position.venueName}</p>
                    <p className="text-white/40 text-sm flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      {position.lockEnds} remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{position.amount.toLocaleString()} $VIBE</p>
                    {position.multiplier > 1 && (
                      <p className="text-yellow-400 text-sm flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {position.multiplier}x Multiplier
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-sm">
                    +{position.pendingRewards} $VIBE pending
                  </p>
                  <button className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'earn' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EARN_VIBE_ACTIONS).map(([key, action]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                onClick={() => onEarnAction?.(key)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:border-green-500/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{action.amount} $VIBE</span>
                </div>
                <p className="text-white/60 text-sm">{action.description}</p>
                {action.cooldown > 0 && (
                  <p className="text-white/40 text-xs mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Cooldown: {Math.floor(action.cooldown / 3600)} hours
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
        
        {activeTab === 'spend' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(SPEND_VIBE_ACTIONS).map(([key, action]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSpendAction?.(key)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">{action.cost} $VIBE</span>
                </div>
                <p className="text-white/60 text-sm">{action.description}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
      
      {/* APY Info */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-white font-medium">Staking Rewards</p>
              <p className="text-white/60 text-sm">Stake to favorite venues & earn APY</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {VIBE_TOKEN_CONFIG.staking.rewardAPY * 100}% APY
          </p>
        </div>
      </div>
    </div>
  );
}
