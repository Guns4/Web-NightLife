'use client';

/**
 * Check-in Page - "Tap & Glow" Experience
 * Phase 4.2: Physical-Digital Integration
 * 
 * Features:
 * - Premium landing animation with Framer Motion
 * - Success animation with XP reward
 * - Tier badge glow effect
 * - Social circle friend notification
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Users, 
  Trophy, 
  CheckCircle2,
  MapPin,
  Navigation
} from 'lucide-react';
import { processPhysicalCheckIn, getStationInfo } from '@/lib/actions/checkin.actions';

// Types
interface StationInfo {
  id: string;
  name: string;
  station_type: string;
  venue_id: string;
  venue_name?: string;
  qr_color?: string;
  min_tier_access?: string;
  cover_charge?: number;
}

interface CheckInResult {
  success: boolean;
  message: string;
  xp_awarded?: number;
  new_badge?: string;
  checkin_id?: string;
  session_id?: string;
}

// Badge colors
const BADGE_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF'
};

// Loading skeleton component
function CheckInLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600"
        />
        <p className="mt-4 text-white/60">Memverifikasi...</p>
      </div>
    </div>
  );
}

// Success animation component
function SuccessAnimation({ 
  result, 
  station 
}: { 
  result: CheckInResult; 
  station: StationInfo | null;
}) {
  const badgeColor = BADGE_COLORS.gold;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.8 }}
      className="text-center"
    >
      {/* Main success circle */}
      <motion.div
        animate={{ 
          boxShadow: [
            `0 0 20px ${badgeColor}40`,
            `0 0 60px ${badgeColor}60`,
            `0 0 20px ${badgeColor}40`
          ]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 border-2 border-fuchsia-500/50 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-fuchsia-500/30"
        />
        <CheckCircle2 className="w-16 h-16 text-fuchsia-400" />
      </motion.div>

      {/* Welcome message */}
      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-2xl font-bold text-white"
      >
        Selamat Datang!
      </motion.h2>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-lg text-white/80"
      >
        {station?.venue_name || 'Venue'}
      </motion.p>

      {/* XP Reward */}
      {result.xp_awarded && result.xp_awarded > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600"
        >
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="text-xl font-bold text-white">+{result.xp_awarded} XP</span>
        </motion.div>
      )}

      {/* New Badge */}
      {result.new_badge && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{ backgroundColor: `${badgeColor}20`, border: `1px solid ${badgeColor}` }}
          >
            <Trophy className="w-5 h-5" style={{ color: badgeColor }} />
            <span className="font-semibold" style={{ color: badgeColor }}>
              {result.new_badge}
            </span>
          </div>
        </motion.div>
      )}

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-white/60 max-w-sm mx-auto"
      >
        {result.message}
      </motion.p>

      {/* Friend notification suggestion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 flex items-center justify-center gap-2 text-white/40"
      >
        <Users className="w-4 h-4" />
        <span className="text-sm">Teman-temanmu akan diinformasikan</span>
      </motion.div>
    </motion.div>
  );
}

// Error component
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center"
    >
      <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
        <MapPin className="w-12 h-12 text-red-400" />
      </div>
      
      <h2 className="mt-6 text-xl font-semibold text-white">
        Check-in Gagal
      </h2>
      <p className="mt-2 text-white/60">{message}</p>
      
      <button
        onClick={onRetry}
        className="mt-6 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
      >
        Coba Lagi
      </button>
    </motion.div>
  );
}

// Main check-in content
function CheckInContent() {
  const searchParams = useSearchParams();
  const stationId = searchParams.get('station_id') || '';
  const totpCode = searchParams.get('key') || '';
  const timestamp = parseInt(searchParams.get('ts') || '0', 10);
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [station, setStation] = useState<StationInfo | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location for geofencing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    async function processCheckIn() {
      if (!stationId || !totpCode) {
        setStatus('error');
        setResult({ success: false, message: 'Parameter tidak valid' });
        return;
      }

      // Get station info first
      const stationInfo = await getStationInfo(stationId);
      setStation(stationInfo);

      // For demo, use a mock user ID (in production, get from auth)
      const mockUserId = '00000000-0000-0000-0000-000000000001';
      
      // Process the check-in
      const checkInResult = await processPhysicalCheckIn(
        stationId,
        mockUserId,
        totpCode,
        timestamp,
        'qr',
        { 
          userAgent: navigator.userAgent,
          platform: navigator.platform 
        },
        userLocation?.lat,
        userLocation?.lng
      );

      setResult(checkInResult);
      setStatus(checkInResult.success ? 'success' : 'error');
    }

    if (stationId && totpCode) {
      processCheckIn();
    }
  }, [stationId, totpCode, timestamp, userLocation]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {/* Animated rings */}
            <div className="relative w-32 h-32 mx-auto">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    delay: i * 0.3
                  }}
                  className="absolute inset-0 rounded-full border-2 border-fuchsia-500/50"
                  style={{ 
                    borderRadius: '50%',
                    border: '2px solid rgba(192, 38, 211, 0.5)'
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <Navigation className="w-8 h-8 text-fuchsia-400" />
              </div>
            </div>
            
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-8 text-lg text-white/80"
            >
              Memverifikasi check-in...
            </motion.p>
            
            <p className="mt-2 text-sm text-white/40">
              Pastikan Anda berada di lokasi venue
            </p>
          </motion.div>
        )}

        {status === 'success' && result && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <SuccessAnimation result={result} station={station} />
          </motion.div>
        )}

        {status === 'error' && result && (
          <motion.div
            key="error"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <ErrorDisplay message={result.message} onRetry={handleRetry} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main page component
export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInLoading />}>
      <CheckInContent />
    </Suspense>
  );
}
