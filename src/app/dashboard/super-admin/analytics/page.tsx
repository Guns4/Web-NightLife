'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CityStats {
  city_id: string;
  city_name: string;
  total_visits: number;
  total_revenue: number;
  active_users: number;
  venues_count: number;
}

interface NationalStats {
  totalVisits: number;
  totalRevenue: number;
  totalBookings: number;
  activeUsers: number;
  venuesCount: number;
  growth: number;
}

interface TrendData {
  date: string;
  visits: number;
  revenue: number;
}

interface TopVenue {
  name: string;
  category: string;
  visits: number;
  revenue: number;
}

export default function SuperAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [nationalStats, setNationalStats] = useState<NationalStats>({
    totalVisits: 0,
    totalRevenue: 0,
    totalBookings: 0,
    activeUsers: 0,
    venuesCount: 0,
    growth: 0
  });
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [topVenues, setTopVenues] = useState<TopVenue[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cities' | 'venues'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    
    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Mock data for demo
    const mockNational: NationalStats = {
      totalVisits: Math.floor(Math.random() * 1000000) + 500000,
      totalRevenue: Math.floor(Math.random() * 50000000000) + 10000000000,
      totalBookings: Math.floor(Math.random() * 100000) + 50000,
      activeUsers: Math.floor(Math.random() * 50000) + 20000,
      venuesCount: 1247,
      growth: 12.5
    };
    
    const mockCityStats: CityStats[] = [
      { city_id: '1', city_name: 'Jakarta', total_visits: 450000, total_revenue: 15000000000, active_users: 25000, venues_count: 450 },
      { city_id: '2', city_name: 'Bali', total_visits: 280000, total_revenue: 12000000000, active_users: 15000, venues_count: 320 },
      { city_id: '3', city_name: 'Surabaya', total_visits: 180000, total_revenue: 8000000000, active_users: 12000, venues_count: 210 },
      { city_id: '4', city_name: 'Bandung', total_visits: 120000, total_revenue: 5000000000, active_users: 8000, venues_count: 150 },
      { city_id: '5', city_name: 'Medan', total_visits: 80000, total_revenue: 3000000000, active_users: 5000, venues_count: 80 },
      { city_id: '6', city_name: 'Makassar', total_visits: 60000, total_revenue: 2500000000, active_users: 4000, venues_count: 60 }
    ];
    
    const mockTrends: TrendData[] = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 50000) + 30000,
        revenue: Math.floor(Math.random() * 2000000000) + 500000000
      };
    });
    
    const mockTopVenues: TopVenue[] = [
      { name: 'Club D', category: 'Club', visits: 45000, revenue: 2500000000 },
      { name: 'Sky Lounge', category: 'Bar', visits: 38000, revenue: 1800000000 },
      { name: 'Jazz Corner', category: 'Live Music', visits: 32000, revenue: 1200000000 },
      { name: 'Rooftop Bar', category: 'Bar', visits: 28000, revenue: 950000000 },
      { name: 'KTV Premier', category: 'KTV', visits: 25000, revenue: 2100000000 }
    ];
    
    setNationalStats(mockNational);
    setCityStats(mockCityStats);
    setTrends(mockTrends);
    setTopVenues(mockTopVenues);
    setLoading(false);
  }

  function formatNumber(num: number): string {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  function formatCurrency(num: number): string {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)}T`;
    }
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(0)}jt`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">🏛️ Super Admin Analytics</h1>
            <p className="text-purple-300">National Nightlife Intelligence Dashboard</p>
          </div>
          
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-purple-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
            <div className="text-purple-400 text-xs uppercase tracking-wider">Total Visits</div>
            <div className="text-2xl font-bold">{formatNumber(nationalStats.totalVisits)}</div>
            <div className="text-green-400 text-xs">↑ {nationalStats.growth}%</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-4 border border-green-500/30">
            <div className="text-green-400 text-xs uppercase tracking-wider">Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(nationalStats.totalRevenue)}</div>
            <div className="text-green-400 text-xs">↑ 18%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
            <div className="text-blue-400 text-xs uppercase tracking-wider">Bookings</div>
            <div className="text-2xl font-bold">{formatNumber(nationalStats.totalBookings)}</div>
            <div className="text-green-400 text-xs">↑ 15%</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 rounded-xl p-4 border border-pink-500/30">
            <div className="text-pink-400 text-xs uppercase tracking-wider">Active Users</div>
            <div className="text-2xl font-bold">{formatNumber(nationalStats.activeUsers)}</div>
            <div className="text-green-400 text-xs">↑ 22%</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl p-4 border border-yellow-500/30">
            <div className="text-yellow-400 text-xs uppercase tracking-wider">Venues</div>
            <div className="text-2xl font-bold">{nationalStats.venuesCount}</div>
            <div className="text-green-400 text-xs">+ 47 this month</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-xl p-4 border border-orange-500/30">
            <div className="text-orange-400 text-xs uppercase tracking-wider">Avg/Visit</div>
            <div className="text-2xl font-bold">{formatCurrency(nationalStats.totalRevenue / nationalStats.totalVisits)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          {(['overview', 'cities', 'venues'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Visit Trends</h3>
              <div className="h-48 flex items-end gap-1">
                {trends.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-purple-500/50 hover:bg-purple-500 rounded-t transition-colors relative group"
                    style={{ height: `${(t.visits / Math.max(...trends.map(x => x.visits))) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {formatNumber(t.visits)} visits
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{trends[0]?.date}</span>
                <span>{trends[trends.length - 1]?.date}</span>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="h-48 flex items-end gap-1">
                {trends.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500/50 hover:bg-green-500 rounded-t transition-colors relative group"
                    style={{ height: `${(t.revenue / Math.max(...trends.map(x => x.revenue))) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {formatCurrency(t.revenue)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{trends[0]?.date}</span>
                <span>{trends[trends.length - 1]?.date}</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
              <div className="space-y-3">
                {[
                  { name: 'Clubs', value: 35, color: 'bg-purple-500' },
                  { name: 'Bars', value: 28, color: 'bg-blue-500' },
                  { name: 'Live Music', value: 18, color: 'bg-pink-500' },
                  { name: 'KTV', value: 12, color: 'bg-yellow-500' },
                  { name: 'Lounges', value: 7, color: 'bg-green-500' }
                ].map(cat => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span>{cat.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Peak Hours Today</h3>
              <div className="grid grid-cols-6 gap-1">
                {['18:00', '20:00', '22:00', '00:00', '02:00', '04:00'].map((hour, i) => {
                  const intensity = [10, 25, 55, 100, 60, 20][i];
                  return (
                    <div key={hour} className="text-center">
                      <div
                        className="rounded-lg mb-2 transition-colors"
                        style={{
                          height: '40px',
                          backgroundColor: `rgba(168, 85, 247, ${intensity / 100})`
                        }}
                      />
                      <div className="text-xs text-gray-400">{hour}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cities Tab */}
        {activeTab === 'cities' && (
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">City</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Visits</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Active Users</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Venues</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {cityStats.map(city => (
                  <tr key={city.city_id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{city.city_name}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(city.total_visits)}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(city.total_revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(city.active_users)}</td>
                    <td className="px-4 py-3 text-right">{city.venues_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="w-24 ml-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(city.total_visits / cityStats[0].total_visits) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Rank</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Venue</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Category</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Visits</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {topVenues.map((venue, i) => (
                  <tr key={i} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-400/20 text-gray-300' :
                        i === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{venue.name}</td>
                    <td className="px-4 py-3 text-gray-400">{venue.category}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(venue.visits)}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(venue.revenue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400">↑ {Math.floor(Math.random() * 20) + 5}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
