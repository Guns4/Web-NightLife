'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  Calendar,
  Target,
  DollarSign,
  Zap,
  TrendingUp,
  Eye,
  MousePointer,
  Users,
  Clock,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  LayoutDashboard,
  Search,
  Star,
  ChevronDown,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import {
  getOwnerPromos,
  getVenuePromos,
  createMerchantPromo,
  updateMerchantPromo,
  deleteMerchantPromo,
  togglePromoStatus,
  getVenueBoostStatus,
  purchaseVenueBoost,
  estimatePromoReach,
  BOOST_SLOTS,
  MerchantPromo,
} from '@/lib/actions/merchant-promos.actions';
import { getOwnerVenues } from '@/lib/actions/owner';
import { Venue } from '@/lib/database/types';

// Target categories
const TARGET_CATEGORIES = [
  { id: 'all', label: 'All Guests', icon: Users },
  { id: 'vip', label: 'VIP Members', icon: Star },
  { id: 'regular', label: 'Regular Guests', icon: Users },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'couples', label: 'Couples', icon: Users },
];

// Duration options for boost
const DURATION_OPTIONS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
];

export default function PromosPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [promos, setPromos] = useState<MerchantPromo[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promos' | 'boost'>('promos');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<MerchantPromo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promo_code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_spend: 0,
    max_discount: 0,
    start_date: '',
    end_date: '',
    day_of_week: [0, 1, 2, 3, 4, 5, 6] as number[],
    usage_limit: 0,
    poster_url: '',
    target_category: 'all',
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Boost state
  const [boostStatus, setBoostStatus] = useState<{
    is_boosted: boolean;
    boost_expiry: string | null;
    boost_slot: string | null;
  } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [purchasing, setPurchasing] = useState(false);
  
  // Performance preview
  const [estimatedReach, setEstimatedReach] = useState<number>(100);

  // Mock user ID - in production, get from auth
  const userId = 'demo-user-id';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      loadVenueData(selectedVenue);
    }
  }, [selectedVenue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const venuesData = await getOwnerVenues(userId);
      setVenues(venuesData);
      if (venuesData.length > 0) {
        setSelectedVenue(venuesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVenueData = async (venueId: string) => {
    try {
      const [promosData, boostData, reach] = await Promise.all([
        getVenuePromos(venueId),
        getVenueBoostStatus(venueId),
        estimatePromoReach(venueId),
      ]);
      setPromos(promosData);
      setBoostStatus(boostData);
      setEstimatedReach(reach);
    } catch (error) {
      console.error('Failed to load venue data:', error);
    }
  };

  const handlePosterDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onload = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onload = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;
    
    setFormSubmitting(true);
    try {
      let posterUrl = formData.poster_url;
      
      // Upload poster if selected
      if (posterFile) {
        // In production, upload to Cloudinary
        posterUrl = posterPreview;
      }

      const promoData = {
        ...formData,
        poster_url: posterUrl,
      };

      if (editingPromo) {
        await updateMerchantPromo(editingPromo.id, userId, promoData);
      } else {
        await createMerchantPromo(selectedVenue, userId, promoData);
      }
      
      await loadVenueData(selectedVenue);
      resetForm();
    } catch (error) {
      console.error('Failed to save promo:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;
    
    try {
      await deleteMerchantPromo(promoId, userId);
      await loadVenueData(selectedVenue);
    } catch (error) {
      console.error('Failed to delete promo:', error);
    }
  };

  const handleToggleActive = async (promoId: string, isActive: boolean) => {
    try {
      await togglePromoStatus(promoId, userId, !isActive);
      await loadVenueData(selectedVenue);
    } catch (error) {
      console.error('Failed to toggle promo:', error);
    }
  };

  const handlePurchaseBoost = async () => {
    if (!selectedVenue || !selectedSlot) return;
    
    setPurchasing(true);
    try {
      await purchaseVenueBoost(selectedVenue, userId, selectedSlot, selectedDuration);
      await loadVenueData(selectedVenue);
      setSelectedSlot('');
    } catch (error) {
      console.error('Failed to purchase boost:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPromo(null);
    setFormData({
      title: '',
      description: '',
      promo_code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_spend: 0,
      max_discount: 0,
      start_date: '',
      end_date: '',
      day_of_week: [0, 1, 2, 3, 4, 5, 6],
      usage_limit: 0,
      poster_url: '',
      target_category: 'all',
    });
    setPosterFile(null);
    setPosterPreview('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isPromoActive = (promo: MerchantPromo) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return promo.is_active && now >= start && now <= end;
  };

  const getSlotIcon = (slotId: string) => {
    switch (slotId) {
      case 'homepage_banner': return LayoutDashboard;
      case 'top_search': return Search;
      case 'featured_card': return Star;
      default: return Zap;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-syne font-bold bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
                Promo & Ads Manager
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage your promos and boost your venue visibility
              </p>
            </div>
            
            {/* Venue Selector */}
            {venues.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
                >
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 p-1 bg-white/5 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('promos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'promos'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Percent className="w-4 h-4 inline-block mr-2" />
              Promos
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'boost'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 inline-block mr-2" />
              Boost Venue
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'promos' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                    <Percent className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Promos</p>
                    <p className="text-xl font-bold text-white">{promos.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Active Now</p>
                    <p className="text-xl font-bold text-white">
                      {promos.filter(isPromoActive).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Est. Reach</p>
                    <p className="text-xl font-bold text-white">{estimatedReach}+</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">This Week</p>
                    <p className="text-xl font-bold text-white">
                      {Math.floor(estimatedReach * 0.3)} views
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Preview */}
            <div className="bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#D4AF37]/20 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-syne font-semibold text-[#D4AF37]">
                    Your promo will be seen by approximately {estimatedReach}+ users
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Based on last week's traffic to {venues.find(v => v.id === selectedVenue)?.name || 'your venue'}
                  </p>
                </div>
              </div>
            </div>

            {/* Promos List */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-syne font-semibold text-white">Your Promos</h2>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C9A227] text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Promo
              </button>
            </div>

            {promos.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <div className="p-4 bg-white/5 rounded-full w-16 h-16 mx-auto mb-4">
                  <Percent className="w-8 h-8 text-gray-500 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No promos yet</h3>
                <p className="text-gray-400 mb-4">Create your first promo to attract more guests</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C9A227] text-black px-4 py-2 rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Promo
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {promos.map((promo) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white/5 border rounded-xl p-4 flex flex-col md:flex-row gap-4 ${
                      isPromoActive(promo)
                        ? 'border-green-500/50'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Poster */}
                    <div className="w-full md:w-24 h-24 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {promo.poster_url ? (
                        <img
                          src={promo.poster_url}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white truncate">{promo.title}</h3>
                          {promo.description && (
                            <p className="text-gray-400 text-sm truncate">{promo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isPromoActive(promo) && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Active
                            </span>
                          )}
                          {promo.is_active && !isPromoActive(promo) && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              Scheduled
                            </span>
                          )}
                          {!promo.is_active && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {promo.discount_type === 'percentage'
                            ? `${promo.discount_value}% OFF`
                            : formatCurrency(promo.discount_value)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {TARGET_CATEGORIES.find(c => c.id === promo.target_category)?.label || 'All'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(promo.id, promo.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          promo.is_active
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        }`}
                        title={promo.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {promo.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPromo(promo);
                          setFormData({
                            title: promo.title,
                            description: promo.description || '',
                            promo_code: promo.promo_code || '',
                            discount_type: promo.discount_type,
                            discount_value: promo.discount_value,
                            min_spend: promo.min_spend || 0,
                            max_discount: promo.max_discount || 0,
                            start_date: promo.start_date.split('T')[0],
                            end_date: promo.end_date.split('T')[0],
                            day_of_week: promo.day_of_week,
                            usage_limit: promo.usage_limit || 0,
                            poster_url: promo.poster_url || '',
                            target_category: promo.target_category || 'all',
                          });
                          setPosterPreview(promo.poster_url || '');
                          setShowForm(true);
                        }}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Boost Venue Section */
          <>
            {/* Current Boost Status */}
            {boostStatus?.is_boosted && (
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/50 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#D4AF37]/30 rounded-xl">
                      <Zap className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-syne font-semibold text-[#D4AF37]">
                        Venue is Boosted!
                      </h3>
                      <p className="text-gray-300">
                        {BOOST_SLOTS.find(s => s.id === boostStatus.boost_slot)?.name} - 
                        Expires {boostStatus.boost_expiry ? formatDate(boostStatus.boost_expiry) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Status</p>
                    <span className="inline-flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Slots */}
            <h2 className="text-lg font-syne font-semibold text-white mb-4">Premium Slots</h2>
            <p className="text-gray-400 text-sm mb-6">
              Choose a premium slot to boost your venue visibility and attract more guests
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {BOOST_SLOTS.map((slot) => {
                const Icon = getSlotIcon(slot.id);
                const isSelected = selectedSlot === slot.id;
                const isCurrentlyActive = boostStatus?.boost_slot === slot.id;
                
                return (
                  <motion.div
                    key={slot.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`relative bg-white/5 border rounded-xl p-6 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : isCurrentlyActive
                        ? 'border-green-500/50'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isCurrentlyActive && (
                      <div className="absolute -top-2 -right-2 px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-full">
                        ACTIVE
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-xl w-fit mb-4 ${
                      isSelected ? 'bg-[#D4AF37]/30' : 'bg-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                    </div>
                    
                    <h3 className="font-syne font-semibold text-white mb-2">{slot.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{slot.description}</p>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        {formatCurrency(slot.price_per_day)}
                      </span>
                      <span className="text-gray-500">/day</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Duration & Purchase */}
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h3 className="font-syne font-semibold text-white mb-4">Select Duration</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.days}
                      onClick={() => setSelectedDuration(option.days)}
                      className={`py-3 px-4 rounded-lg border text-center transition-all ${
                        selectedDuration === option.days
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        BOOST_SLOTS.find(s => s.id === selectedSlot)?.price_per_day! * selectedDuration
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handlePurchaseBoost}
                    disabled={purchasing || boostStatus?.is_boosted}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      boostStatus?.is_boosted
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-[#D4AF37] hover:bg-[#C9A227] text-black'
                    }`}
                  >
                    {purchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                        Processing...
                      </>
                    ) : boostStatus?.is_boosted ? (
                      <>
                        <Zap className="w-4 h-4" />
                        Already Boosted
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Purchase Boost
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Promo Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#0A0A0F] border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-xl font-syne font-bold text-white">
                  {editingPromo ? 'Edit Promo' : 'Create New Promo'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Poster Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Promo Poster
                  </label>
                  <div
                    onDrop={handlePosterDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      posterPreview
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/20 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    {posterPreview ? (
                      <div className="relative">
                        <img
                          src={posterPreview}
                          alt="Poster preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPosterFile(null);
                            setPosterPreview('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          Drag and drop your poster here, or{' '}
                          <label className="text-[#D4AF37] cursor-pointer hover:underline">
                            browse
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePosterSelect}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          PNG, JPG, WebP - Auto-optimized to WebP
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Promo Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="e.g., Weekend Special Discount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      placeholder="Describe your promo..."
                    />
                  </div>
                </div>

                {/* Discount */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (IDR)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      required
                      min={0}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      placeholder={formData.discount_type === 'percentage' ? '20' : '50000'}
                    />
                  </div>
                </div>

                {/* Promo Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Promo Code (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.promo_code}
                    onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="e.g., WEEKEND20"
                  />
                </div>

                {/* Validity Period */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      min={formData.start_date}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Target Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TARGET_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, target_category: cat.id })}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            formData.target_category === cat.id
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                              : 'border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C9A227] text-black py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingPromo ? 'Update Promo' : 'Create Promo'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component for the percent icon
function Percent({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
