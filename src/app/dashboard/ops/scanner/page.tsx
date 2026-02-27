'use client';

/**
 * Membership Scanner Page
 * Phase 4.3: Owner Dashboard - Membership Scanner
 * 
 * Features:
 * - Camera-based QR scanner
 * - Member verification
 * - Privilege display
 * - Scan history
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Crown,
  Zap,
  Users,
  Clock,
  Search,
  Shield,
  X,
  RotateCcw,
  History
} from 'lucide-react';

// Types
interface MemberInfo {
  id: string;
  name: string;
  memberId: string;
  tier: string;
  level: number;
  xp: number;
  privileges: {
    name: string;
    description: string;
  }[];
  isValid: boolean;
}

interface ScanResult {
  id: string;
  memberName: string;
  memberId: string;
  tier: string;
  timestamp: string;
  result: 'success' | 'expired' | 'invalid';
  venueName?: string;
}

// Tier colors
const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2'
};

// Mock scan history for demo
const mockHistory: ScanResult[] = [
  {
    id: '1',
    memberName: 'Sarah Wijaya',
    memberId: 'GD00567',
    tier: 'gold',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    result: 'success'
  },
  {
    id: '2',
    memberName: 'Budi Santoso',
    memberId: 'SV00234',
    tier: 'silver',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    result: 'success'
  },
  {
    id: '3',
    memberName: 'INVALID_USER',
    memberId: 'BZ99999',
    tier: 'bronze',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    result: 'invalid'
  }
];

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MemberInfo | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(mockHistory);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [manualMemberId, setManualMemberId] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock function to simulate QR scan
  const simulateScan = () => {
    // Random member for demo
    const members: MemberInfo[] = [
      {
        id: '1',
        name: 'Sarah Wijaya',
        memberId: 'GD00567',
        tier: 'gold',
        level: 18,
        xp: 3200,
        privileges: [
          { name: 'Entry', description: '4x Free Entry/month' },
          { name: 'Discount', description: '15% Off Bottles' },
          { name: 'Priority', description: 'VIP Queue' }
        ],
        isValid: true
      },
      {
        id: '2',
        name: 'Ahmad Rizki',
        memberId: 'PL00001',
        tier: 'platinum',
        level: 25,
        xp: 8500,
        privileges: [
          { name: 'Unlimited', description: 'Unlimited Entry' },
          { name: 'VIP Access', description: 'Exclusive VIP Area' },
          { name: 'Guest Pass', description: '3 Free Guests' }
        ],
        isValid: true
      },
      {
        id: '3',
        name: 'Jessica Lee',
        memberId: 'SV00345',
        tier: 'silver',
        level: 10,
        xp: 1200,
        privileges: [
          { name: 'Entry', description: '2x Free Entry/month' },
          { name: 'Priority', description: 'Skip Queue' }
        ],
        isValid: true
      }
    ];
    
    const randomMember = members[Math.floor(Math.random() * members.length)];
    setScanResult(randomMember);
    setShowResult(true);
    
    // Add to history
    const newScan: ScanResult = {
      id: Date.now().toString(),
      memberName: randomMember.name,
      memberId: randomMember.memberId,
      tier: randomMember.tier,
      timestamp: new Date().toISOString(),
      result: 'success'
    };
    setScanHistory(prev => [newScan, ...prev]);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowResult(false);
      setScanResult(null);
    }, 5000);
  };

  // Start camera scanning (simulated)
  const startScanning = () => {
    setIsScanning(true);
    // In production, would use a library like html5-qrcode or react-qr-reader
    // For demo, simulate automatic scan after 2 seconds
    setTimeout(() => {
      simulateScan();
      setIsScanning(false);
    }, 2000);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  // Manual lookup
  const handleManualLookup = () => {
    if (!manualMemberId) return;
    
    // Simulate manual lookup
    const member: MemberInfo = {
      id: 'manual',
      name: 'Manual Lookup',
      memberId: manualMemberId,
      tier: 'gold',
      level: 15,
      xp: 2500,
      privileges: [
        { name: 'Entry', description: '4x Free Entry/month' }
      ],
      isValid: true
    };
    
    setScanResult(member);
    setShowResult(true);
    setManualMemberId('');
  };

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-7 h-7 text-fuchsia-400" />
          Membership Scanner
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Pindai kartu membership untuk verifikasi
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'scan' 
              ? 'bg-fuchsia-600 text-white' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Camera className="w-5 h-5 inline-block mr-2" />
          Scanner
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'history' 
              ? 'bg-fuchsia-600 text-white' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <History className="w-5 h-5 inline-block mr-2" />
          Riwayat
        </button>
      </div>

      {activeTab === 'scan' && (
        <div className="space-y-4">
          {/* Scanner View */}
          <div className="relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-black">
            {/* Camera placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {isScanning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      <QrCode className="w-20 h-20 text-fuchsia-400 mx-auto" />
                    </motion.div>
                    <p className="mt-4 text-white/60">Memindai...</p>
                  </>
                ) : (
                  <>
                    <QrCode className="w-20 h-20 text-white/30 mx-auto" />
                    <p className="mt-4 text-white/40">Tekan tombol di bawah untuk memulai</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Scanning frame */}
            {isScanning && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-8 border-2 border-fuchsia-400/50 rounded-2xl"
              >
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-fuchsia-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-fuchsia-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-fuchsia-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-fuchsia-400 rounded-br-lg" />
              </motion.div>
            )}
            
            {/* Camera overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Scan Button */}
          <button
            onClick={isScanning ? stopScanning : startScanning}
            disabled={isScanning}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isScanning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-fuchsia-600 hover:bg-fuchsia-700 hover:scale-[1.02]'
            }`}
          >
            {isScanning ? (
              <>
                <X className="w-5 h-5 inline-block mr-2" />
                Berhenti
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 inline-block mr-2" />
                Mulai Pemindaian
              </>
            )}
          </button>

          {/* Manual Lookup */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 mb-3">Atau masukkan ID manual:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value.toUpperCase())}
                placeholder="Contoh: GD00123"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
              />
              <button
                onClick={handleManualLookup}
                className="px-4 py-3 bg-fuchsia-600/20 border border-fuchsia-500/50 rounded-xl text-fuchsia-400 hover:bg-fuchsia-600/30"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {scanHistory.map((scan) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl border ${
                scan.result === 'success' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: `${TIER_COLORS[scan.tier]}33` }}
                  >
                    {scan.memberName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{scan.memberName}</p>
                    <p className="text-sm text-white/50">{scan.memberId}</p>
                  </div>
                </div>
                <div className="text-right">
                  {scan.result === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <p className="text-xs text-white/40 mt-1">{formatTime(scan.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Scan Result Modal */}
      <AnimatePresence>
        {showResult && scanResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Result Icon */}
              <div className="text-center mb-4">
                {scanResult.isValid ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                )}
              </div>

              {/* Status */}
              <h2 className={`text-xl font-bold text-center mb-4 ${
                scanResult.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {scanResult.isValid ? 'VERIFIKASI BERHASIL' : 'VERIFIKASI GAGAL'}
              </h2>

              {/* Member Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/60">Nama</span>
                  <span className="font-medium">{scanResult.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/60">Member ID</span>
                  <span className="font-mono">{scanResult.memberId}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/60">Tier</span>
                  <div className="flex items-center gap-2">
                    <Crown 
                      className="w-5 h-5" 
                      style={{ color: TIER_COLORS[scanResult.tier] }} 
                    />
                    <span className="capitalize font-medium">{scanResult.tier}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/60">Level</span>
                  <span className="font-medium">Lv.{scanResult.level}</span>
                </div>
              </div>

              {/* Privileges */}
              {scanResult.isValid && scanResult.privileges.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-white/60 mb-2">Privileges:</p>
                  <div className="space-y-2">
                    {scanResult.privileges.map((priv, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 text-sm text-green-400"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {priv.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowResult(false)}
                className="w-full py-3 bg-white/10 rounded-xl text-white/80 hover:bg-white/20"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
