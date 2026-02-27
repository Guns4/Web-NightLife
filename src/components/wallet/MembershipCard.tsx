'use client';

/**
 * Membership Card Component
 * Phase 4.3: Digital Membership Card (Wallet Integration)
 * 
 * Features:
 * - 3D parallax effect card preview
 * - Dynamic QR code with TOTP
 * - Tier-based styling
 * - Add to Apple/Google Wallet buttons
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Apple, 
  Crown, 
  Zap, 
  Shield, 
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Wallet
} from 'lucide-react';
import { 
  getMembershipCard, 
  getUserProfile, 
  generateDynamicQRToken,
  getTierConfig,
  getTierProgression
} from '@/lib/actions/wallet.actions';

// Types
interface TierConfig {
  name: string;
  color: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

interface MembershipCardProps {
  userId: string;
  onAddToWallet?: () => void;
}

// Mock user for demo (in production, get from auth)
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Ahmad Rizki',
  email: 'ahmad@example.com',
  tier: 'gold',
  xp_total: 2500,
  level: 12
};

const mockCard = {
  id: '1',
  member_id: 'GD00123',
  card_serial_number: 'NL2024-123456',
  current_tier: 'gold',
  privileges: [
    { name: 'Entry Points', value: '4', description: '4x Free Entry per month' },
    { name: 'Birthday Reward', value: '50%', description: '50% Birthday Discount' },
    { name: 'Queue Skip', value: 'true', description: 'VIP Queue Access' },
    { name: 'Bottle Discount', value: '15%', description: '15% Off Bottle Service' }
  ]
};

export default function MembershipCard({ userId, onAddToWallet }: MembershipCardProps) {
  const [qrToken, setQrToken] = useState<string>('LOADING...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Get tier config
  const tierConfig = getTierConfig(mockUser.tier);
  const progression = getTierProgression(mockUser.xp_total);
  
  // Refresh QR token every 30 seconds
  useEffect(() => {
    const refreshQR = () => {
      // Mock QR token for demo
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let token = '';
      for (let i = 0; i < 8; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setQrToken(token);
    };
    
    refreshQR();
    const interval = setInterval(refreshQR, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Parallax effect on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x: x * 20, y: y * 20 });
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Mock refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setQrToken(token);
    setIsRefreshing(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <motion.div
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
        style={{
          perspective: '1000px'
        }}
      >
        {/* Main Card */}
        <motion.div
          animate={{
            rotateY: mousePosition.x,
            rotateX: -mousePosition.y
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${tierConfig.backgroundColor}22 0%, ${tierConfig.backgroundColor}44 100%)`,
            border: `1px solid ${tierConfig.color}44`,
            boxShadow: `0 25px 50px -12px ${tierConfig.color}33, 0 0 0 1px ${tierConfig.color}22`
          }}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${tierConfig.color} 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}
            />
          </div>
          
          {/* Card Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${tierConfig.color}33` }}
                >
                  <Crown className="w-6 h-6" style={{ color: tierConfig.color }} />
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Membership</p>
                  <p className="font-bold text-lg" style={{ color: tierConfig.color }}>
                    {tierConfig.icon} {tierConfig.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">MEMBER ID</p>
                <p className="font-mono text-sm text-white/80">{mockCard.member_id}</p>
              </div>
            </div>
            
            {/* Member Name */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{mockUser.full_name}</h2>
              <p className="text-white/50 text-sm">Level {mockUser.level} • {mockUser.xp_total.toLocaleString()} XP</p>
            </div>
            
            {/* Progress to Next Tier */}
            {progression.nextTier && (
              <div className="mb-6 p-3 rounded-xl bg-black/20">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/60">Progress to {progression.nextTier}</span>
                  <span className="text-white">{progression.xpToNextTier} XP</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progression.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: tierConfig.color }}
                  />
                </div>
              </div>
            )}
            
            {/* QR Code Section */}
            <div className="flex items-center gap-4">
              <div 
                className="w-28 h-28 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto" style={{ color: '#1a1a1a' }} />
                  <p className="text-[8px] text-gray-500 mt-1 font-mono">{qrToken}</p>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Dynamic QR • Refreshes 30s</span>
                </div>
                <p className="text-white/40 text-xs">
                  Show this QR at venue entrance for verification
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs text-white/80"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh QR
                </button>
              </div>
            </div>
          </div>
          
          {/* Card Footer Gradient */}
          <div 
            className="h-2"
            style={{ 
              background: `linear-gradient(90deg, ${tierConfig.color} 0%, transparent 100%)` 
            }}
          />
        </motion.div>
        
        {/* Glow Effect */}
        <div 
          className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl -z-10"
          style={{ backgroundColor: tierConfig.color }}
        />
      </motion.div>
      
      {/* Add to Wallet Buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onAddToWallet}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02]"
          style={{ 
            backgroundColor: '#000000',
            color: '#FFFFFF'
          }}
        >
          <Apple className="w-5 h-5" />
          Add to Apple Wallet
        </button>
        
        <button
          onClick={onAddToWallet}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02]"
          style={{ 
            backgroundColor: '#4285F4',
            color: '#FFFFFF'
          }}
        >
          <Wallet className="w-5 h-5" />
          Save to Google Wallet
        </button>
      </div>
      
      {/* Privileges Preview */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-fuchsia-400" />
          <span className="text-sm font-medium text-white">Your Privileges</span>
        </div>
        <div className="space-y-2">
          {mockCard.privileges.slice(0, 3).map((priv: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{priv.description}</span>
            </div>
          ))}
          {mockCard.privileges.length > 3 && (
            <p className="text-xs text-white/40 pl-6">
              +{mockCard.privileges.length - 3} more privileges
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
