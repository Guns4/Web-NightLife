'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Campaign {
  id: string;
  campaign_name: string;
  venue_id: string;
  total_budget: number;
  commission_per_booking: number;
  current_bookings: number;
  target_bookings: number;
  required_platforms: string[];
  content_hashtags: string[];
  status: string;
  start_date: string;
  end_date: string;
  venue?: { name: string };
}

interface Conversion {
  id: string;
  platform: string;
  content_url: string;
  commission_amount: number;
  is_paid: boolean;
  converted_at: string;
  campaign?: { campaign_name: string };
}

export default function InfluencerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'conversions' | 'earnings'>('campaigns');
  
  // Setup form
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    loadInfluencerData();
  }, []);

  async function loadInfluencerData() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Load profile
    const { data: profileData } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setProfile(profileData);
    
    if (profileData) {
      // Load active campaigns
      const { data: campaignsData } = await supabase
        .from('influencer_campaigns')
        .select('*, venue:venues(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      setCampaigns(campaignsData || []);
      
      // Load conversions
      const { data: conversionsData } = await supabase
        .from('influencer_conversions')
        .select('*, campaign:influencer_campaigns(campaign_name)')
        .eq('influencer_id', profileData.id)
        .order('converted_at', { ascending: false })
        .limit(20);
      
      setConversions(conversionsData || []);
    }
    
    setLoading(false);
  }

  async function setupProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('influencer_profiles')
      .upsert({
        user_id: user.id,
        instagram_handle: instagram,
        tiktok_handle: tiktok,
        youtube_channel: youtube,
        follower_count: followers
      });
    
    if (!error) {
      setShowSetupModal(false);
      loadInfluencerData();
    }
  }

  function getVerificationBadge(level: string) {
    const badges: Record<string, { color: string; label: string }> = {
      basic: { color: 'bg-gray-500/20 text-gray-300', label: 'Basic' },
      silver: { color: 'bg-gray-300/20 text-gray-200', label: 'Silver' },
      gold: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Gold' },
      platinum: { color: 'bg-purple-500/20 text-purple-300', label: 'Platinum' }
    };
    return badges[level] || badges.basic;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-6">🌟</div>
          <h1 className="text-3xl font-bold mb-4">Become an Influencer Partner</h1>
          <p className="text-gray-400 mb-8">
            Join our influencer program and earn commission for every booking you drive to nightlife venues.
          </p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold text-lg"
          >
            Get Started
          </button>
          
          {showSetupModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Setup Your Profile</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">TikTok Handle</label>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">YouTube Channel</label>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                      placeholder="Channel name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Total Followers</label>
                    <input
                      type="number"
                      value={followers}
                      onChange={(e) => setFollowers(parseInt(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={setupProfile}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Influencer Dashboard</h1>
            <p className="text-purple-300">Earn commissions by promoting nightlife venues</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm ${getVerificationBadge(profile.verification_level).color}`}>
              {getVerificationBadge(profile.verification_level).label} Partner
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-purple-400 text-sm">Total Earnings</div>
            <div className="text-3xl font-bold">Rp {(profile.total_earnings || 0).toLocaleString('id-ID')}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-green-400 text-sm">Pending Payout</div>
            <div className="text-3xl font-bold">Rp {(profile.pending_payout || 0).toLocaleString('id-ID')}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-blue-400 text-sm">Total Conversions</div>
            <div className="text-3xl font-bold">{profile.total_conversions || 0}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-pink-400 text-sm">Total Reach</div>
            <div className="text-3xl font-bold">{(profile.total_reach || 0).toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setActiveTab('conversions')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'conversions'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Conversions
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'earnings'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Earnings
          </button>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mb-3">
                  📍 {campaign.venue?.name || 'Venue'}
                </div>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Bookings</span>
                    <span>{campaign.current_bookings || 0}/{campaign.target_bookings || '∞'}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min(((campaign.current_bookings || 0) / (campaign.target_bookings || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Commission */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">Commission</div>
                    <div className="font-bold text-green-400">
                      Rp {campaign.commission_per_booking?.toLocaleString('id-ID') || 50000}/booking
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Budget</div>
                    <div className="text-sm">Rp {(campaign.total_budget || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>
                
                {/* Hashtags */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {campaign.content_hashtags?.map((tag, i) => (
                    <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Actions */}
                <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm font-medium">
                  Promote Campaign
                </button>
              </div>
            ))}
            
            {campaigns.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No active campaigns. Check back soon for new opportunities!
              </div>
            )}
          </div>
        )}

        {/* Conversions Tab */}
        {activeTab === 'conversions' && (
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Platform</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Campaign</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Commission</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {conversions.map(conv => (
                  <tr key={conv.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className="capitalize">{conv.platform}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {conv.campaign?.campaign_name || 'Direct'}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-400">
                      Rp {conv.commission_amount?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        conv.is_paid ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {conv.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(conv.converted_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {conversions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No conversions yet
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Payout Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Available Balance</span>
                  <span className="font-bold text-green-400">Rp {profile.pending_payout?.toLocaleString('id-ID') || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Earned</span>
                  <span className="font-bold">Rp {profile.total_earnings?.toLocaleString('id-ID') || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commission Rate</span>
                  <span className="font-bold">{(profile.commission_rate || 0.05) * 100}%</span>
                </div>
              </div>
              <button className="w-full mt-6 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium">
                Request Payout
              </button>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Your Links</h3>
              <p className="text-sm text-gray-400 mb-4">
                Share your unique referral link to earn commissions on every booking
              </p>
              <div className="bg-gray-900 p-3 rounded-lg font-mono text-sm break-all">
                https://nightlife.id/ref/{profile.id?.slice(0, 8)}
              </div>
              <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm">
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
