/**
 * =====================================================
 * AI INSIGHTS DASHBOARD
 * AfterHoursID - Algorithm Performance Monitoring
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';

// Types
interface AIMetrics {
  algorithmAccuracy: {
    ctr: number;
    ctrChange: number;
    conversionRate: number;
    conversionLift: number;
  };
  recommendationStats: {
    totalRecommendations: number;
    clickThroughs: number;
    conversions: number;
    hideRate: number;
  };
  trendingStats: {
    viralVenues: number;
    risingVenues: number;
    avgSpike: number;
  };
  userEngagement: {
    activeUsers: number;
    avgSessionTime: number;
    returnRate: number;
  };
}

interface TrendVenue {
  id: string;
  name: string;
  spike: number;
  status: 'viral' | 'hot' | 'rising';
}

export default function AIInsightsDashboard() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [trendingVenues, setTrendingVenues] = useState<TrendVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // Mock data
      setMetrics({
        algorithmAccuracy: {
          ctr: 24.5,
          ctrChange: 3.2,
          conversionRate: 8.7,
          conversionLift: 42,
        },
        recommendationStats: {
          totalRecommendations: 125000,
          clickThroughs: 30625,
          conversions: 10875,
          hideRate: 5.2,
        },
        trendingStats: {
          viralVenues: 12,
          risingVenues: 45,
          avgSpike: 187,
        },
        userEngagement: {
          activeUsers: 45000,
          avgSessionTime: 8.5,
          returnRate: 68,
        },
      });

      setTrendingVenues([
        { id: '1', name: 'Dragonfly Club', spike: 280, status: 'viral' },
        { id: '2', name: 'Basement Jakarta', spike: 195, status: 'hot' },
        { id: '3', name: 'Colony Surabaya', spike: 150, status: 'hot' },
        { id: '4', name: 'Fame Jakarta', spike: 120, status: 'rising' },
        { id: '5', name: 'XYZ Gallery', spike: 95, status: 'rising' },
      ]);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viral': return 'bg-red-500';
      case 'hot': return 'bg-orange-500';
      case 'rising': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>🤖</span> AI Insights
          </h1>
          <p className="text-gray-400 mt-1">Algorithm performance & recommendation analytics</p>
        </div>
        
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-gold-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm Performance */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Algorithm Accuracy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Click-Through Rate</div>
            <div className="text-3xl font-bold text-gold-400">
              {metrics?.algorithmAccuracy.ctr}%
            </div>
            <div className="text-sm text-green-400 mt-1">
              ↑ {metrics?.algorithmAccuracy.ctrChange}% vs last period
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Conversion Rate</div>
            <div className="text-3xl font-bold text-green-400">
              {metrics?.algorithmAccuracy.conversionRate}%
            </div>
            <div className="text-sm text-gray-400 mt-1">of clicks convert</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Conversion Lift</div>
            <div className="text-3xl font-bold text-purple-400">
              +{metrics?.algorithmAccuracy.conversionLift}%
            </div>
            <div className="text-sm text-gray-400 mt-1">vs random selection</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Hide Rate</div>
            <div className="text-3xl font-bold text-red-400">
              {metrics?.recommendationStats.hideRate}%
            </div>
            <div className="text-sm text-gray-400 mt-1">users hide recommendations</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trending Venues */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🔥 Viral & Trending Venues</h2>
          <div className="space-y-3">
            {trendingVenues.map((venue) => (
              <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(venue.status)}`}>
                    {venue.status.toUpperCase()}
                  </span>
                  <span className="text-white font-medium">{venue.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-gold-400 font-bold">+{venue.spike}%</div>
                  <div className="text-xs text-gray-400">vs 7-day avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Recommendation Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Total Recommendations</span>
                <span className="text-white font-medium">
                  {metrics?.recommendationStats.totalRecommendations.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gold-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Click-Throughs</span>
                <span className="text-white font-medium">
                  {metrics?.recommendationStats.clickThroughs.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '24.5%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Conversions</span>
                <span className="text-white font-medium">
                  {metrics?.recommendationStats.conversions.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '8.7%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Engagement */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">👥 User Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold text-white">
              {metrics?.userEngagement.activeUsers.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm mt-1">Active Users</div>
          </div>
          
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold text-white">
              {metrics?.userEngagement.avgSessionTime} min
            </div>
            <div className="text-gray-400 text-sm mt-1">Avg Session Time</div>
          </div>
          
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold text-green-400">
              {metrics?.userEngagement.returnRate}%
            </div>
            <div className="text-gray-400 text-sm mt-1">Return Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
