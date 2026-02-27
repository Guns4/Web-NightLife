'use client';

/**
 * Station Management Page
 * Phase 4.2: Owner Dashboard - QR/NFC Station Management
 * 
 * Features:
 * - List all stations (entrances, tables, VIP areas)
 * - Generate QR codes for each station
 * - Manual check-in for VIP guests
 * - Live guest list
 * - NFC tag registration
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Edit3, 
  ToggleLeft, 
  ToggleRight,
  Users,
  MapPin,
  Wifi,
  Copy,
  Check,
  Download,
  Search,
  UserPlus,
  Clock,
  Zap
} from 'lucide-react';

// Types
interface Station {
  id: string;
  name: string;
  station_type: string;
  is_active: boolean;
  is_online: boolean;
  totp_enabled: boolean;
  min_tier_access: string;
  cover_charge: number;
  total_checkins: number;
  last_checkin_at: string | null;
  qr_color: string;
}

interface Guest {
  id: string;
  timestamp: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    level: number;
  };
  station: {
    name: string;
    station_type: string;
  };
}

// Station type options
const STATION_TYPES = [
  { value: 'reception', label: 'Resepsionis', icon: '🎫' },
  { value: 'table_vip', label: 'Meja VIP', icon: '👑' },
  { value: 'table_regular', label: 'Meja Regular', icon: '🪑' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'vip_area', label: 'Area VIP', icon: '⭐' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌙' },
];

// Mock data for demo
const mockStations: Station[] = [
  {
    id: '1',
    name: 'Pintu Utama',
    station_type: 'reception',
    is_active: true,
    is_online: true,
    totp_enabled: true,
    min_tier_access: 'bronze',
    cover_charge: 50000,
    total_checkins: 1250,
    last_checkin_at: '2024-01-15T22:30:00Z',
    qr_color: '#C026D3'
  },
  {
    id: '2',
    name: 'VIP Table 1',
    station_type: 'table_vip',
    is_active: true,
    is_online: true,
    totp_enabled: true,
    min_tier_access: 'gold',
    cover_charge: 500000,
    total_checkins: 89,
    last_checkin_at: '2024-01-15T23:45:00Z',
    qr_color: '#FFD700'
  },
  {
    id: '3',
    name: 'Main Bar',
    station_type: 'bar',
    is_active: true,
    is_online: true,
    totp_enabled: true,
    min_tier_access: 'bronze',
    cover_charge: 0,
    total_checkins: 456,
    last_checkin_at: '2024-01-15T23:55:00Z',
    qr_color: '#9333EA'
  },
];

const mockGuests: Guest[] = [
  {
    id: '1',
    timestamp: '2024-01-15T23:55:00Z',
    user: { id: '1', full_name: 'Ahmad Rizki', avatar_url: null, level: 15 },
    station: { name: 'Pintu Utama', station_type: 'reception' }
  },
  {
    id: '2',
    timestamp: '2024-01-15T23:45:00Z',
    user: { id: '2', full_name: 'Sarah Wijaya', avatar_url: null, level: 22 },
    station: { name: 'VIP Table 1', station_type: 'table_vip' }
  },
  {
    id: '3',
    timestamp: '2024-01-15T23:30:00Z',
    user: { id: '3', full_name: 'Budi Santoso', avatar_url: null, level: 8 },
    station: { name: 'Main Bar', station_type: 'bar' }
  },
];

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const [activeTab, setActiveTab] = useState<'stations' | 'guests' | 'manual'>('stations');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New station form
  const [newStation, setNewStation] = useState({
    name: '',
    station_type: 'reception',
    min_tier_access: 'bronze',
    cover_charge: 0,
    qr_color: '#C026D3'
  });

  // Manual check-in form
  const [manualCheckIn, setManualCheckIn] = useState({
    name: '',
    phone: '',
    station_id: ''
  });

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.station_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateQR = async (station: Station) => {
    setSelectedStation(station);
    // Mock QR URL - in production, call server action
    const baseUrl = 'https://nightlife.id/checkin';
    const mockKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Math.floor(Date.now() / 1000 / 30);
    setQrUrl(`${baseUrl}/${station.id}?key=${mockKey}&ts=${timestamp}`);
  };

  const handleCopyUrl = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleActive = (stationId: string) => {
    setStations(prev => prev.map(s => 
      s.id === stationId ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const handleDeleteStation = (stationId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus stasiun ini?')) {
      setStations(prev => prev.filter(s => s.id !== stationId));
    }
  };

  const handleManualCheckIn = () => {
    if (!manualCheckIn.name || !manualCheckIn.station_id) {
      alert('Mohon isi nama dan pilih stasiun');
      return;
    }
    alert(`Guest "${manualCheckIn.name}" berhasil di-check-in!`);
    setManualCheckIn({ name: '', phone: '', station_id: '' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStationTypeLabel = (type: string) => {
    return STATION_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manajemen Stasiun</h1>
        <p className="text-white/60 mt-2">
          Kelola QR codes, NFC tags, dan check-in manual untuk venue Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-600/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stations.length}</p>
              <p className="text-white/60 text-sm">Total Stasiun</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{guests.length}</p>
              <p className="text-white/60 text-sm">Guests Aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stations.reduce((sum, s) => sum + s.total_checkins, 0).toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Total Check-ins</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-white/60 text-sm">NFC Tags Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'stations' ? 'text-fuchsia-400' : 'text-white/60 hover:text-white'
          }`}
        >
          Daftar Stasiun
          {activeTab === 'stations' && (
            <motion.div 
              layoutId="activeTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('guests')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'guests' ? 'text-fuchsia-400' : 'text-white/60 hover:text-white'
          }`}
        >
          Live Guest List
          {activeTab === 'guests' && (
            <motion.div 
              layoutId="activeTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'manual' ? 'text-fuchsia-400' : 'text-white/60 hover:text-white'
          }`}
        >
          Check-in Manual
          {activeTab === 'manual' && (
            <motion.div 
              layoutId="activeTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-500"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'stations' && (
          <motion.div
            key="stations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Search & Add */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari stasiun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Tambah Stasiun
              </button>
            </div>

            {/* Stations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStations.map((station) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white/5 rounded-2xl p-6 border ${
                    station.is_active ? 'border-white/10' : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{station.name}</h3>
                      <p className="text-white/60 text-sm">
                        {getStationTypeLabel(station.station_type)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(station.id)}
                      className={`transition-colors ${
                        station.is_active ? 'text-green-400' : 'text-white/30'
                      }`}
                    >
                      {station.is_active ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Cover Charge</span>
                      <span className="font-medium">
                        {station.cover_charge > 0 
                          ? `Rp ${station.cover_charge.toLocaleString('id-ID')}` 
                          : 'Gratis'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Min. Tier</span>
                      <span className="font-medium capitalize">{station.min_tier_access}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Total Check-ins</span>
                      <span className="font-medium">{station.total_checkins}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateQR(station)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 rounded-lg text-fuchsia-400 text-sm font-medium transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                    <button
                      onClick={() => handleDeleteStation(station.id)}
                      className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'guests' && (
          <motion.div
            key="guests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60 font-medium">Guest</th>
                    <th className="text-left p-4 text-white/60 font-medium">Lokasi</th>
                    <th className="text-left p-4 text-white/60 font-medium">Check-in</th>
                    <th className="text-left p-4 text-white/60 font-medium">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center font-medium">
                            {guest.user.full_name[0]}
                          </div>
                          <span className="font-medium">{guest.user.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin className="w-4 h-4 text-fuchsia-400" />
                          {guest.station.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-white/80">
                          <Clock className="w-4 h-4" />
                          {formatTime(guest.timestamp)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-fuchsia-600/20 text-fuchsia-400 text-sm font-medium">
                          Level {guest.user.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl"
          >
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-6">Check-in Manual Tamu VIP</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Nama Tamu</label>
                  <input
                    type="text"
                    value={manualCheckIn.name}
                    onChange={(e) => setManualCheckIn(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama tamu"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">No. HP (Opsional)</label>
                  <input
                    type="tel"
                    value={manualCheckIn.phone}
                    onChange={(e) => setManualCheckIn(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Stasiun</label>
                  <select
                    value={manualCheckIn.station_id}
                    onChange={(e) => setManualCheckIn(prev => ({ ...prev, station_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="">Pilih stasiun</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleManualCheckIn}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <UserPlus className="w-5 h-5" />
                  Check-in Tamu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedStation && qrUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedStation(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">{selectedStation.name}</h3>
                <p className="text-white/60">{getStationTypeLabel(selectedStation.station_type)}</p>
              </div>

              {/* QR Placeholder */}
              <div 
                className="w-64 h-64 mx-auto rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${selectedStation.qr_color}20`, border: `2px solid ${selectedStation.qr_color}` }}
              >
                <QrCode className="w-32 h-32" style={{ color: selectedStation.qr_color }} />
              </div>

              {/* URL Copy */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={qrUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className="p-3 bg-fuchsia-600/20 rounded-xl text-fuchsia-400 hover:bg-fuchsia-600/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={() => setSelectedStation(null)}
                className="w-full py-3 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Station Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">Tambah Stasiun Baru</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Nama Stasiun</label>
                  <input
                    type="text"
                    value={newStation.name}
                    onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Pintu Utama"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Tipe Stations</label>
                  <select
                    value={newStation.station_type}
                    onChange={(e) => setNewStation(prev => ({ ...prev, station_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    {STATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Minimum Tier Akses</label>
                  <select
                    value={newStation.min_tier_access}
                    onChange={(e) => setNewStation(prev => ({ ...prev, min_tier_access: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Cover Charge (Rp)</label>
                  <input
                    type="number"
                    value={newStation.cover_charge}
                    onChange={(e) => setNewStation(prev => ({ ...prev, cover_charge: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (newStation.name) {
                        setStations(prev => [...prev, {
                          id: Date.now().toString(),
                          ...newStation,
                          is_active: true,
                          is_online: true,
                          totp_enabled: true,
                          total_checkins: 0,
                          last_checkin_at: null
                        }]);
                        setShowAddModal(false);
                        setNewStation({ name: '', station_type: 'reception', min_tier_access: 'bronze', cover_charge: 0, qr_color: '#C026D3' });
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
