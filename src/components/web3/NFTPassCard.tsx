'use client';

/**
 * NFT Pass Card Component
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Features:
 * - Display NFT pass with tier styling
 * - Show utilities and redemption status
 * - Secondary market listing
 * - Royalty info
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Crown, 
  Zap, 
  Users, 
  Clock,
  ExternalLink,
  RefreshCw,
  Wallet,
  TrendingUp,
  Gift,
  ArrowRight
} from 'lucide-react';
import { NFT_PASS_CONFIG } from '@/lib/contracts/nft-pass';

interface NFTPassCardProps {
  tier: 'black' | 'gold' | 'silver' | 'bronze';
  venueName: string;
  passNumber: number;
  utilities: {
    id: string;
    name: string;
    description: string;
    redeemed: number;
    maxRedeemable: number;
  }[];
  isOwned?: boolean;
  isListed?: boolean;
  listingPrice?: number;
  onRedeem?: (utilityId: string) => void;
  onList?: (price: number) => void;
  onBuy?: () => void;
}

export default function NFTPassCard({
  tier,
  venueName,
  passNumber,
  utilities,
  isOwned = false,
  isListed = false,
  listingPrice,
  onRedeem,
  onList,
  onBuy,
}: NFTPassCardProps) {
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  
  const tierConfig = NFT_PASS_CONFIG.tiers[tier];
  
  const getUtilityIcon = (utilityId: string) => {
    const icons: Record<string, any> = {
      unlimited_entry: Crown,
      monthly_entry: Users,
      skip_line: Zap,
      priority_queue: Zap,
      table_upgrade: TrendingUp,
      table_discount: TrendingUp,
      private_room: Lock,
      guest_pass: Users,
      priority_booking: Clock,
      loyalty_points: Zap,
    };
    return icons[utilityId] || Gift;
  };
  
  const handleRedeem = async (utilityId: string) => {
    setIsRedeeming(utilityId);
    try {
      await onRedeem?.(utilityId);
    } finally {
      setIsRedeeming(null);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-sm"
    >
      {/* Card */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: tierConfig.gradient,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '16px 16px'
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
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">NFT Pass</p>
                <p className="font-bold text-lg text-white">
                  {tierConfig.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">PASS</p>
              <p className="font-mono text-sm text-white/80">#{passNumber.toString().padStart(4, '0')}</p>
            </div>
          </div>
          
          {/* Venue */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">{venueName}</h3>
            <p className="text-white/50 text-sm">Exclusive Access Pass</p>
          </div>
          
          {/* Utilities */}
          <div className="space-y-3 mb-6">
            <p className="text-white/60 text-xs uppercase tracking-wider">Your Utilities</p>
            {utilities.slice(0, 4).map((utility) => {
              const Icon = getUtilityIcon(utility.id);
              const canRedeem = utility.redeemed < utility.maxRedeemable;
              
              return (
                <div 
                  key={utility.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white/80" />
                    <div>
                      <p className="text-white text-sm font-medium">{utility.name}</p>
                      <p className="text-white/40 text-xs">{utility.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs">
                      {utility.redeemed}/{utility.maxRedeemable}
                    </p>
                    {isOwned && canRedeem && (
                      <button
                        onClick={() => handleRedeem(utility.id)}
                        disabled={isRedeeming === utility.id}
                        className="mt-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {isRedeeming === utility.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          'Redeem'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Status Badge */}
          {isListed && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              Listed for Sale
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Wallet className="w-4 h-4" />
              <span>{tierConfig.utilities.length} Utilities</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>{tierConfig.royalty}% Royalty</span>
            </div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div 
          className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl -z-10"
          style={{ backgroundColor: tierConfig.color }}
        />
      </div>
      
      {/* Actions */}
      <div className="mt-4 space-y-2">
        {isOwned && !isListed && (
          <button
            onClick={() => onList?.(listingPrice || tierConfig.price)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            List on Marketplace
          </button>
        )}
        
        {!isOwned && !isListed && (
          <button
            onClick={onBuy}
            className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Buy for {tierConfig.price} MATIC
          </button>
        )}
        
        {isOwned && utilities.some(u => u.redeemed < u.maxRedeemable) && (
          <button
            className="w-full py-3 px-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            View All Utilities
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * NFT Pass Marketplace Component
 */
interface NFTPassMarketplaceProps {
  venueId?: string;
}

export function NFTPassMarketplace({ venueId }: NFTPassMarketplaceProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  // Mock data for available passes
  const availablePasses = [
    { venue: 'Club XYZ', tier: 'gold' as const, price: 200, count: 3 },
    { venue: 'Lounge ABC', tier: 'silver' as const, price: 75, count: 12 },
    { venue: 'Bar 123', tier: 'bronze' as const, price: 25, count: 45 },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(NFT_PASS_CONFIG.tiers).map(([tier, config]) => {
        const tierKey = tier as keyof typeof NFT_PASS_CONFIG.tiers;
        return (
          <motion.div
            key={tier}
            whileHover={{ scale: 1.02 }}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
              selectedTier === tier ? 'ring-2 ring-white' : ''
            }`}
            style={{
              background: config.gradient,
            }}
            onClick={() => setSelectedTier(tier)}
          >
            <div className="text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">{config.name}</h3>
              <p className="text-white/60 text-sm mb-4">{config.utilities.length} Utilities</p>
              <p className="text-2xl font-bold text-white">{config.price} MATIC</p>
              <p className="text-white/40 text-xs mt-1">
                {config.maxSupply - 50} / {config.maxSupply} available
              </p>
            </div>
            
            {/* Utility Preview */}
            <div className="mt-6 space-y-2">
              {config.utilities.slice(0, 3).map((utility) => (
                <div 
                  key={utility.id}
                  className="flex items-center gap-2 text-white/80 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span>{utility.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
