/**
 * =====================================================
 * DIGITAL MEMBERSHIP CARD
 * AfterHoursID - NightPass Glowing Card
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';

interface MembershipCardProps {
  userId: string;
  tier: 'silver' | 'gold' | 'platinum' | 'vip';
  name: string;
  memberSince: string;
  benefits: {
    freeEntry: number;
    freeDrinks: number;
    skipLine: boolean;
    vipAccess: boolean;
  };
}

export default function DigitalMembershipCard({
  userId,
  tier,
  name,
  memberSince,
  benefits,
}: MembershipCardProps) {
  const [otp, setOtp] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    // Generate new OTP every 60 seconds
    const generateOtp = () => {
      // Mock OTP generation - in production, call the API
      const newOtp = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
      setOtp(newOtp);
      setCountdown(60);
    };

    generateOtp();
    const interval = setInterval(generateOtp, 60000);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [userId]);

  const tierColors = {
    silver: {
      gradient: 'from-gray-400 to-gray-600',
      glow: 'shadow-gray-400/30',
      border: 'border-gray-400',
    },
    gold: {
      gradient: 'from-amber-400 to-yellow-600',
      glow: 'shadow-amber-400/30',
      border: 'border-amber-400',
    },
    platinum: {
      gradient: 'from-purple-400 to-purple-700',
      glow: 'shadow-purple-400/30',
      border: 'border-purple-400',
    },
    vip: {
      gradient: 'from-red-500 to-red-700',
      glow: 'shadow-red-500/30',
      border: 'border-red-500',
    },
  };

  const colors = tierColors[tier];

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Animated glow border */}
      <div
        className={`
          absolute -inset-1 
          bg-gradient-to-r ${colors.gradient}
          rounded-2xl blur-lg opacity-75
          animate-pulse
        `}
      />

      {/* Card */}
      <div
        className={`
          relative bg-gray-900 
          rounded-2xl overflow-hidden
          border-2 ${colors.border}
          ${colors.glow} shadow-xl
        `}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Card Header */}
        <div className="relative p-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white">NightPass</h3>
              <p className="text-sm text-gray-400 capitalize">{tier} Member</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Member Since</p>
              <p className="text-white font-medium">{memberSince}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="relative px-6 pb-4">
          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Dynamic QR</span>
              <span className="text-xs text-green-600 font-medium">
                🔄 {countdown}s
              </span>
            </div>
            {/* QR Code visualization */}
            <div className="bg-black rounded-lg p-4 text-center">
              <div className="font-mono text-2xl font-bold text-black tracking-widest">
                {otp}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Show this to the hostess
              </p>
            </div>
          </div>
        </div>

        {/* Member Info */}
        <div className="relative px-6 pb-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 mb-1">Member Name</p>
              <p className="text-white font-semibold">{name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Member ID</p>
              <p className="text-white font-mono text-sm">
                {userId.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Bar */}
        <div className="relative bg-black/50 p-4">
          <div className="flex justify-around">
            <Benefit icon="🎫" label="Entry" value={benefits.freeEntry} />
            <Benefit icon="🍸" label="Drinks" value={benefits.freeDrinks} />
            <Benefit 
              icon="⚡" 
              label="Skip Line" 
              value={benefits.skipLine ? '✓' : '—'} 
            />
            <Benefit 
              icon="👑" 
              label="VIP" 
              value={benefits.vipAccess ? '✓' : '—'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="text-center">
      <span className="text-xl block mb-1">{icon}</span>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}
