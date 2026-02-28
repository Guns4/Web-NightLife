'use client';

/**
 * =====================================================
 * ROI DASHBOARD PAGE
 * AfterHoursID - Real-Time ROI Dashboard
 * =====================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';

// Types
interface DashboardData {
  summary: {
    totalRevenue: number;
    totalAdSpend: number;
    totalUsers: number;
    overallROI: number;
    lastUpdated: string;
  };
  metrics: {
    userRegistrations: number;
    bookingClicks: number;
    activeSessions: number;
  };
  timeSeries: {
    timestamp: string;
    revenue: number;
    adSpend: number;
    userAcquisition: number;
    conversionRate: number;
    roi: number;
  }[];
  topVenues: {
    venueId: string;
    venueName: string;
    bookings: number;
    revenue: number;
    rating: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  recentTransactions: {
    orderId: string;
    grossAmount: number;
    settlementStatus: string;
    paymentType: string;
    transactionTime: string;
  }[];
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  trend, 
  icon,
  color = 'cyan' 
}: { 
  title: string; 
  value: string; 
  trend?: string; 
  icon: string;
  color?: 'cyan' | 'purple' | 'amber' | 'green';
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 shadow-cyan-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 shadow-purple-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 shadow-amber-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 shadow-green-500/20',
  };
  
  const iconColors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
  };
  
  return (
    <div className={`
      relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} 
      backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02]
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${iconColors[color]} font-mono`}>{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-gray-400">
              <span className={trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                {trend}
              </span>
              {' '}vs last period
            </p>
          )}
        </div>
        <div className={`text-3xl ${iconColors[color]}`}>{icon}</div>
      </div>
      {/* Glow effect */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-${color}-500/10 blur-2xl`} />
    </div>
  );
}

// Chart placeholder (simple line visualization)
function MiniChart({ data, color = 'cyan' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((value, i) => (
        <div
          key={i}
          className={`flex-1 bg-${color}-500/60 rounded-t transition-all duration-300 hover:bg-${color}-400`}
          style={{ height: `${((value - min) / range) * 100}%` }}
        />
      ))}
    </div>
  );
}

// Trend indicator
function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const styles = {
    up: 'bg-green-500/20 text-green-400 border-green-500/30',
    down: 'bg-red-500/20 text-red-400 border-red-500/30',
    stable: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  
  const icons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${styles[trend]}`}>
      {icons[trend]} {trend}
    </span>
  );
}

export default function ROIDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/roi/dashboard?period=7d');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 font-mono">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8 border border-red-500/30 rounded-xl bg-red-500/10">
          <p className="text-red-400 text-xl mb-2">⚠️ Error</p>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) return null;
  
  const revenueData = data.timeSeries.map(d => d.revenue);
  const roiData = data.timeSeries.map(d => d.roi);
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ROI Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time performance metrics • Last updated: {lastRefresh.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(data.summary.totalRevenue)} 
          trend="+12.5%"
          icon="💰"
          color="purple"
        />
        <StatCard 
          title="Ad Spend" 
          value={formatCurrency(data.summary.totalAdSpend)} 
          trend="+5.2%"
          icon="📊"
          color="cyan"
        />
        <StatCard 
          title="New Users" 
          value={data.summary.totalUsers.toLocaleString()} 
          trend="+8.3%"
          icon="👥"
          color="green"
        />
        <StatCard 
          title="ROI" 
          value={`${data.summary.overallROI.toFixed(1)}%`} 
          trend="+15.7%"
          icon="📈"
          color="amber"
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Revenue Trend</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <MiniChart data={revenueData} color="purple" />
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-400">Min: {formatCurrency(Math.min(...revenueData))}</span>
            <span className="text-gray-400">Max: {formatCurrency(Math.max(...revenueData))}</span>
          </div>
        </div>
        
        {/* ROI Chart */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200">ROI Trend</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <MiniChart data={roiData} color="amber" />
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-400">Min: {Math.min(...roiData).toFixed(1)}%</span>
            <span className="text-gray-400">Max: {Math.max(...roiData).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Venues */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Top Performing Venues</h3>
          <div className="space-y-3">
            {data.topVenues.map((venue, index) => (
              <div 
                key={venue.venueId}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-200">{venue.venueName}</p>
                    <p className="text-xs text-gray-500">{venue.bookings} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-cyan-400">{formatCurrency(venue.revenue)}</p>
                  <TrendBadge trend={venue.trend} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {data.recentTransactions.slice(0, 5).map((tx) => (
              <div 
                key={tx.orderId}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50"
              >
                <div>
                  <p className="font-mono text-xs text-gray-400">{tx.orderId}</p>
                  <p className="text-xs text-gray-500">{tx.paymentType}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-purple-400">{formatCurrency(tx.grossAmount)}</p>
                  <span className={`
                    text-xs px-2 py-0.5 rounded
                    ${tx.settlementStatus === 'settlement' ? 'bg-green-500/20 text-green-400' : 
                      tx.settlementStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'}
                  `}>
                    {tx.settlementStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between text-sm text-gray-500">
        <p>Powered by Prometheus + Grafana</p>
        <p>Latency: &lt;100ms • Auto-refresh: 30s</p>
      </div>
    </div>
  );
}
