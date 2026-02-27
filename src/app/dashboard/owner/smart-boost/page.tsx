'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Pause, 
  Play, 
  Plus,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  MousePointer,
  Users
} from 'lucide-react';
import { 
  getSmartBoostCampaigns, 
  createSmartBoostCampaign,
  toggleSmartBoostAutoPilot,
  triggerSmartBoost 
} from '@/lib/actions/predictive-intelligence.actions';

interface SmartBoostCampaign {
  id: string;
  venue_id: string;
  campaign_name: string;
  daily_budget: number;
  total_spent: number;
  auto_pilot_enabled: boolean;
  status: string;
  ai_recommendation: string;
  trigger_count: number;
  total_impressions: number;
  total_clicks: number;
  total_bookings: number;
}

export default function SmartBoostPage() {
  const [campaigns, setCampaigns] = useState<SmartBoostCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    daily_budget: 100000
  });

  // Mock venue ID - in production, get from URL or context
  const venueId = 'demo-venue-id';

  useEffect(() => {
    loadCampaigns();
  }, [venueId]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getSmartBoostCampaigns(venueId);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await createSmartBoostCampaign(venueId, 'owner-id', {
        name: newCampaign.name,
        daily_budget: newCampaign.daily_budget
      });
      setShowCreateModal(false);
      setNewCampaign({ name: '', daily_budget: 100000 });
      loadCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleToggleAutoPilot = async (campaignId: string, enabled: boolean) => {
    await toggleSmartBoostAutoPilot(campaignId, enabled);
    loadCampaigns();
  };

  const handleTriggerBoost = async (campaignId: string) => {
    await triggerSmartBoost(campaignId);
    loadCampaigns();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const totalStats = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.total_impressions,
    clicks: acc.clicks + c.total_clicks,
    bookings: acc.bookings + c.total_bookings,
    spent: acc.spent + c.total_spent
  }), { impressions: 0, clicks: 0, bookings: 0, spent: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            Smart-Boost 2.0
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-Powered Autonomous Marketing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Impressions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.impressions.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.clicks.toLocaleString()}</p>
            </div>
            <MousePointer className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.bookings.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalStats.spent)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>
      </div>

      {/* Auto-Pilot Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">Auto-Pilot Marketing</h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
              AI automatically triggers boosts when: venue is below 50% occupancy, 
              high-density audience detected within 3km, or competitor venues are full.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Your Campaigns</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No campaigns yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {campaign.campaign_name}
                      </h3>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                      {campaign.auto_pilot_enabled && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Auto-Pilot
                        </span>
                      )}
                    </div>
                    
                    {campaign.ai_recommendation && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        {campaign.ai_recommendation}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Daily Budget</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(campaign.daily_budget)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(campaign.total_spent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Triggers</p>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.trigger_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CTR</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {campaign.total_impressions > 0 
                            ? ((campaign.total_clicks / campaign.total_impressions) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerBoost(campaign.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Trigger Boost Now"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleAutoPilot(campaign.id, !campaign.auto_pilot_enabled)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.auto_pilot_enabled 
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={campaign.auto_pilot_enabled ? 'Auto-Pilot On' : 'Auto-Pilot Off'}
                    >
                      {campaign.auto_pilot_enabled ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Smart Boost Campaign
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekend Boost"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Budget (IDR)
                </label>
                <input
                  type="number"
                  value={newCampaign.daily_budget}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, daily_budget: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Auto-Pilot will be enabled automatically. AI will optimize your boost timing for maximum ROI.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || newCampaign.daily_budget <= 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Create Campaign
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Import Sparkles
import { Sparkles } from 'lucide-react';
