'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BrandData {
  brand_name: string;
  industry: string;
  subscription_tier: string;
}

interface MarketShare {
  category: string;
  units_sold: number;
  revenue: number;
  share_percentage: number;
  rank: number;
}

interface FlashPromo {
  id: string;
  promo_name: string;
  discount_percentage: number;
  start_time: string;
  end_time: string;
  current_redemptions: number;
  max_redemptions: number;
  status: string;
}

interface ABTest {
  id: string;
  test_name: string;
  variants: { a: string; b: string };
  status: string;
  results: { a: number; b: number };
  winner: string;
}

export default function BrandPortalPage() {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'promos' | 'tests'>('overview');
  const [marketShare, setMarketShare] = useState<MarketShare[]>([]);
  const [promos, setPromos] = useState<FlashPromo[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  
  // Demo brand for display
  const demoBrand: BrandData = {
    brand_name: 'Premium Spirits Co.',
    industry: 'spirit',
    subscription_tier: 'enterprise'
  };

  useEffect(() => {
    // Simulate loading brand data
    setBrand(demoBrand);
    
    // Load mock market share data
    setMarketShare([
      { category: 'Premium Vodka', units_sold: 45000, revenue: 2250000000, share_percentage: 28.5, rank: 1 },
      { category: 'Gold Rum', units_sold: 32000, revenue: 1600000000, share_percentage: 19.2, rank: 2 },
      { category: 'Aged Whiskey', units_sold: 28000, revenue: 2100000000, share_percentage: 15.8, rank: 3 },
      { category: 'Tequila', units_sold: 22000, revenue: 1100000000, share_percentage: 12.4, rank: 4 },
      { category: 'Gin', units_sold: 18000, revenue: 720000000, share_percentage: 8.9, rank: 5 }
    ]);
    
    setPromos([
      { id: '1', promo_name: 'Weekend Shot Special', discount_percentage: 30, start_time: '2026-02-28', end_time: '2026-03-01', current_redemptions: 450, max_redemptions: 1000, status: 'active' },
      { id: '2', promo_name: 'Happy Hour Premium', discount_percentage: 25, start_time: '2026-02-27', end_time: '2026-02-27', current_redemptions: 280, max_redemptions: 500, status: 'active' },
      { id: '3', promo_name: 'Ladies Night Free Shot', discount_percentage: 100, start_time: '2026-03-01', end_time: '2026-03-01', current_redemptions: 0, max_redemptions: 200, status: 'scheduled' }
    ]);
    
    setABTests([
      { id: '1', test_name: 'New Bottle Design A/B', variants: { a: 'Matte Black', b: 'Glossy Gold' }, status: 'running', results: { a: 42, b: 38 }, winner: '' },
      { id: '2', test_name: 'Flavor Test', variants: { a: 'Original', b: 'Citrus Twist' }, status: 'completed', results: { a: 35, b: 65 }, winner: 'b' }
    ]);
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  🥃
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{brand?.brand_name}</h1>
                  <p className="text-purple-300 capitalize">{brand?.industry} Industry</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                brand?.subscription_tier === 'enterprise' ? 'bg-yellow-500/20 text-yellow-300' :
                brand?.subscription_tier === 'premium' ? 'bg-purple-500/20 text-purple-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {brand?.subscription_tier?.toUpperCase()} PLAN
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-purple-400 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold">Rp 7.8T</div>
            <div className="text-green-400 text-xs">↑ 18% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-blue-400 text-sm">Units Sold</div>
            <div className="text-2xl font-bold">145K</div>
            <div className="text-green-400 text-xs">↑ 12% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-pink-400 text-sm">Market Share</div>
            <div className="text-2xl font-bold">28.5%</div>
            <div className="text-green-400 text-xs">↑ 2.3% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-yellow-400 text-sm">Active Venues</div>
            <div className="text-2xl font-bold">847</div>
            <div className="text-green-400 text-xs">↑ 45 new this month</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          {(['overview', 'market', 'promos', 'tests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'market' ? 'Market Share' : tab === 'promos' ? 'Flash Promos' : tab === 'tests' ? 'A/B Tests' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="h-48 flex items-end gap-2">
                {[65, 78, 82, 75, 88, 92, 85, 95, 88, 100, 92, 98].map((v, i) => (
                  <div key={i} className="flex-1 bg-purple-500/50 hover:bg-purple-500 rounded-t transition-colors relative group" style={{ height: `${v}%` }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      Rp {v * 10000000}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
              <div className="space-y-3">
                {marketShare.slice(0, 5).map(cat => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.category}</span>
                      <span className="text-purple-400">{cat.share_percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${cat.share_percentage * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Top Cities</h3>
              <div className="space-y-2">
                {[
                  { city: 'Jakarta', revenue: 3200000000, share: 41 },
                  { city: 'Bali', revenue: 1800000000, share: 23 },
                  { city: 'Surabaya', revenue: 1200000000, share: 15 },
                  { city: 'Bandung', revenue: 800000000, share: 10 },
                  { city: 'Medan', revenue: 600000000, share: 8 }
                ].map(city => (
                  <div key={city.city} className="flex justify-between items-center py-2 border-b border-gray-700/50">
                    <span>{city.city}</span>
                    <div className="text-right">
                      <div className="text-sm">Rp {(city.revenue / 1000000000).toFixed(1)}T</div>
                      <div className="text-xs text-gray-400">{city.share}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Recent Activations</h3>
              <div className="space-y-2">
                {[
                  { action: 'New venue partnership', venue: 'Club D', time: '2 hours ago' },
                  { action: 'Flash promo redeemed', venue: '847 times', time: '5 hours ago' },
                  { action: 'A/B test completed', venue: 'Flavor Test', time: '1 day ago' },
                  { action: 'Market share increased', venue: '+2.3%', time: '3 days ago' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                    <div>
                      <div className="text-sm">{item.action}</div>
                      <div className="text-xs text-gray-400">{item.venue}</div>
                    </div>
                    <div className="text-xs text-gray-500">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Market Share Tab */}
        {activeTab === 'market' && (
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Rank</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Category</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Units Sold</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Share</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {marketShare.map(cat => (
                  <tr key={cat.category} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                        cat.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        cat.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                        cat.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {cat.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{cat.category}</td>
                    <td className="px-4 py-3 text-right">{cat.units_sold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-400">Rp {(cat.revenue / 1000000000).toFixed(1)}T</td>
                    <td className="px-4 py-3 text-right text-purple-400">{cat.share_percentage}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400">↑ 2.3%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Promos Tab */}
        {activeTab === 'promos' && (
          <div className="space-y-4">
            {promos.map(promo => (
              <div key={promo.id} className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{promo.promo_name}</h3>
                    <div className="text-green-400 text-sm">{promo.discount_percentage}% OFF</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    promo.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    promo.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {promo.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-3">
                  <span>{promo.start_time} - {promo.end_time}</span>
                  <span>{promo.current_redemptions}/{promo.max_redemptions} redeemed</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(promo.current_redemptions / promo.max_redemptions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            
            <button className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold">
              + Create New Flash Promo
            </button>
          </div>
        )}

        {/* A/B Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            {abTests.map(test => (
              <div key={test.id} className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{test.test_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      test.status === 'running' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  {test.winner && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Winner</div>
                      <div className="font-bold text-green-400">{test.winner.toUpperCase()}</div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Variant A</div>
                    <div className="font-semibold">{test.variants.a}</div>
                    <div className="text-2xl font-bold text-purple-400">{test.results.a}%</div>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Variant B</div>
                    <div className="font-semibold">{test.variants.b}</div>
                    <div className="text-2xl font-bold text-pink-400">{test.results.b}%</div>
                  </div>
                </div>
              </div>
            ))}
            
            <button className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold">
              + Launch New A/B Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
