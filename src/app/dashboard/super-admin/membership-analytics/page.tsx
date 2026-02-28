/**
 * =====================================================
 * MEMBERSHIP ANALYTICS DASHBOARD
 * AfterHoursID - Retention & Churn Tracking
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  cancelledMembers: number;
  churnRate: number;
  mrr: number;
  ltv: number;
  tierBreakdown: {
    silver: number;
    gold: number;
    platinum: number;
  };
  monthlyTrend: {
    month: string;
    members: number;
    revenue: number;
  }[];
}

export default function MembershipAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      setData({
        totalMembers: 12450,
        activeMembers: 8920,
        newMembers: 1234,
        cancelledMembers: 234,
        churnRate: 2.8,
        mrr: 156000000, // Rp 156M
        ltv: 890000, // Rp 890K
        tierBreakdown: {
          silver: 4200,
          gold: 3100,
          platinum: 1620,
        },
        monthlyTrend: [
          { month: 'Jan', members: 6500, revenue: 120000000 },
          { month: 'Feb', members: 7200, revenue: 138000000 },
          { month: 'Mar', members: 7800, revenue: 145000000 },
          { month: 'Apr', members: 8200, revenue: 152000000 },
          { month: 'May', members: 8500, revenue: 154000000 },
          { month: 'Jun', members: 8920, revenue: 156000000 },
        ],
      });
    } finally {
      setLoading(false);
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
            <span>📊</span> Membership Analytics
          </h1>
          <p className="text-gray-400 mt-1">Retention & Churn Dashboard</p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Members"
          value={data?.totalMembers.toLocaleString() || '0'}
          change="+12%"
          positive
        />
        <MetricCard
          label="Active Members"
          value={data?.activeMembers.toLocaleString() || '0'}
          change="+8%"
          positive
        />
        <MetricCard
          label="Monthly Churn Rate"
          value={`${data?.churnRate}%`}
          change="-0.5%"
          positive
        />
        <MetricCard
          label="Member LTV"
          value={`Rp ${((data?.ltv || 0) / 1000).toFixed(0)}K`}
          change="+15%"
          positive
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Monthly Revenue</h2>
          <div className="h-64 flex items-end gap-2">
            {data?.monthlyTrend.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t"
                  style={{ height: `${(item.revenue / 160000000) * 100}%` }}
                />
                <span className="text-xs text-gray-400 mt-2">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tier Distribution</h2>
          <div className="space-y-4">
            <TierBar label="Silver" count={data?.tierBreakdown.silver || 0} total={data?.activeMembers || 0} color="bg-gray-400" />
            <TierBar label="Gold" count={data?.tierBreakdown.gold || 0} total={data?.activeMembers || 0} color="bg-amber-400" />
            <TierBar label="Platinum" count={data?.tierBreakdown.platinum || 0} total={data?.activeMembers || 0} color="bg-purple-400" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* New vs Cancelled */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">New vs Cancelled</h2>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">+{data?.newMembers}</div>
              <div className="text-gray-400 text-sm">New Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">-{data?.cancelledMembers}</div>
              <div className="text-gray-400 text-sm">Cancelled</div>
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Monthly Recurring Revenue</h2>
          <div className="text-3xl font-bold text-gold-400">
            Rp {((data?.mrr || 0) / 1000000).toFixed(0)}M
          </div>
          <div className="text-green-400 text-sm mt-2">↑ 12% vs last month</div>
        </div>

        {/* Retention Rate */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Retention Rate</h2>
          <div className="text-3xl font-bold text-green-400">
            {100 - (data?.churnRate || 0)}%
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Members retained after 30 days
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  change, 
  positive 
}: { 
  label: string; 
  value: string; 
  change: string; 
  positive: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className={`text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </div>
    </div>
  );
}

function TierBar({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{count.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
