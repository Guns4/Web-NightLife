'use client';

/**
 * Web3 Dashboard Page
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Complete Web3 features dashboard:
 * - Soulbound Token (Identity)
 * - VIBE Token (Loyalty)
 * - NFT Passes
 * - DAO Governance
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Coins, 
  BadgeCheck, 
  Scale, 
  Lock,
  Zap,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Web3Provider, useWallet, useWeb3 } from '@/lib/web3/context';
import { 
  NFTPassCard, 
  VIBETokenDashboard, 
  DAOGoverance, 
  SoulboundTokenCard 
} from '@/components/web3';
import { NFT_PASS_CONFIG, VIBE_TOKEN_CONFIG } from '@/lib/contracts';

function Web3DashboardContent() {
  const { wallet, connect, isConnecting } = useWeb3();
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'tokens' | 'passes' | 'governance'>('overview');
  
  // If wallet not connected, show connect screen
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-white/60">
              Connect your wallet to access Web3 features, manage your $VIBE tokens, 
              NFT passes, and participate in governance.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Why Connect?</h2>
            <ul className="space-y-3">
              {[
                { icon: BadgeCheck, text: 'Own your identity with Soulbound Tokens' },
                { icon: Coins, text: 'Earn $VIBE tokens for every check-in' },
                { icon: Lock, text: 'Access exclusive NFT passes' },
                { icon: Scale, text: 'Vote on platform decisions' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <item.icon className="w-5 h-5 text-purple-400" />
                  {item.text}
                </li>
              ))}
            </ul>
            
            <button
              onClick={connect}
              disabled={isConnecting}
              className="w-full mt-6 py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-400 hover:to-pink-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
          
          <p className="text-center text-white/40 text-sm mt-6">
            Powered by Polygon (Low fees, fast transactions)
          </p>
        </motion.div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'identity', label: 'Identity', icon: BadgeCheck },
    { id: 'tokens', label: '$VIBE Tokens', icon: Coins },
    { id: 'passes', label: 'NFT Passes', icon: Lock },
    { id: 'governance', label: 'Governance', icon: Scale },
  ];
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Web3 Dashboard
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Manage your decentralized identity, tokens, and governance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                <p className="text-white/60 text-xs">Wallet</p>
                <p className="text-white font-mono text-sm">
                  {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
                <p className="text-green-400 text-xs">Polygon</p>
                <p className="text-green-400 font-medium">Connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
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
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Identity Card */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-purple-400" />
                  Your Identity
                </h2>
                <SoulboundTokenCard
                  walletAddress={wallet.address || ''}
                  reputationScore={350}
                />
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-white/60 text-sm">$VIBE Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-white">1,250</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-white/60 text-sm">Staked</span>
                  </div>
                  <p className="text-2xl font-bold text-white">750</p>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-8">
              {/* NFT Passes */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-pink-400" />
                  Your NFT Passes
                </h2>
                <NFTPassCard
                  tier="gold"
                  venueName="Club XYZ"
                  passNumber={123}
                  utilities={[
                    { id: 'monthly_entry', name: '4 Free Entries', description: 'Monthly', redeemed: 2, maxRedeemable: 4 },
                    { id: 'skip_line', name: 'Skip the Line', description: 'Always', redeemed: 12, maxRedeemable: 52 },
                    { id: 'table_discount', name: '20% Table Discount', description: 'On bottle service', redeemed: 1, maxRedeemable: 12 },
                    { id: 'guest_pass', name: '1 Free Guest', description: 'Monthly', redeemed: 0, maxRedeemable: 12 },
                  ]}
                  isOwned={true}
                />
              </div>
              
              {/* Governance Preview */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-400" />
                  Governance Power
                </h2>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/60 text-sm">Your Voting Power</p>
                      <p className="text-3xl font-bold text-white">1,500</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('governance')}
                      className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                    >
                      View Proposals
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Active Proposals</span>
                      <span className="text-white">2</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Can Create Proposal</span>
                      <span className="text-yellow-400">100K $VIBE needed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'identity' && (
          <div className="max-w-md mx-auto">
            <SoulboundTokenCard
              walletAddress={wallet.address || ''}
              reputationScore={350}
            />
          </div>
        )}
        
        {activeTab === 'tokens' && (
          <VIBETokenDashboard
            balance={1250}
            stakedTotal={750}
            pendingRewards={35}
          />
        )}
        
        {activeTab === 'passes' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your NFT Passes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NFTPassCard
                  tier="gold"
                  venueName="Club XYZ"
                  passNumber={123}
                  utilities={[
                    { id: 'monthly_entry', name: '4 Free Entries', description: 'Monthly', redeemed: 2, maxRedeemable: 4 },
                    { id: 'skip_line', name: 'Skip the Line', description: 'Always', redeemed: 12, maxRedeemable: 52 },
                    { id: 'table_discount', name: '20% Table Discount', description: 'On bottle service', redeemed: 1, maxRedeemable: 12 },
                    { id: 'guest_pass', name: '1 Free Guest', description: 'Monthly', redeemed: 0, maxRedeemable: 12 },
                  ]}
                  isOwned={true}
                />
                <NFTPassCard
                  tier="silver"
                  venueName="Lounge ABC"
                  passNumber={456}
                  utilities={[
                    { id: 'monthly_entry', name: '2 Free Entries', description: 'Monthly', redeemed: 1, maxRedeemable: 2 },
                    { id: 'priority_queue', name: 'Priority Queue', description: 'Always', redeemed: 5, maxRedeemable: 52 },
                    { id: 'table_discount', name: '10% Table Discount', description: 'On bottle service', redeemed: 0, maxRedeemable: 12 },
                  ]}
                  isOwned={true}
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Marketplace</h2>
              <p className="text-white/60 mb-4">Discover more passes from venues</p>
            </div>
          </div>
        )}
        
        {activeTab === 'governance' && (
          <DAOGoverance votingPower={1500} />
        )}
      </div>
    </div>
  );
}

export default function Web3DashboardPage() {
  return (
    <Web3Provider>
      <Web3DashboardContent />
    </Web3Provider>
  );
}
