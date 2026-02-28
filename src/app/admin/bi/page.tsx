'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FinanceData {
  id: string;
  period_start: string;
  period_end: string;
  ad_spend: number;
  total_users: number;
  revenue_ppc: number;
  revenue_commissions: number;
  total_revenue: number;
}

interface BusinessMetrics {
  cac: number;
  ltv: number;
  healthRatio: number;
  isHealthy: boolean;
  revenuePerClick: number;
  totalClicks: number;
  saasFees: number;
  adRevenue: number;
}

// Default mock data
const defaultFinanceData: FinanceData[] = [
  {
    id: '1',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    ad_spend: 50000000,
    total_users: 1500,
    revenue_ppc: 25000000,
    revenue_commissions: 75000000,
    total_revenue: 100000000,
  },
  {
    id: '2',
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    ad_spend: 45000000,
    total_users: 1800,
    revenue_ppc: 28000000,
    revenue_commissions: 82000000,
    total_revenue: 110000000,
  },
];

export default function AdminBIDashboard() {
  const [financeData, setFinanceData] = useState<FinanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    cac: 0,
    ltv: 0,
    healthRatio: 0,
    isHealthy: false,
    revenuePerClick: 0,
    totalClicks: 0,
    saasFees: 0,
    adRevenue: 0,
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_finance')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching finance data:', error);
        setFinanceData(defaultFinanceData);
      } else if (data && data.length > 0) {
        setFinanceData(data);
      } else {
        setFinanceData(defaultFinanceData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setFinanceData(defaultFinanceData);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: FinanceData[]) => {
    if (data.length === 0) return;

    const totalAdSpend = data.reduce((sum, d) => sum + d.ad_spend, 0);
    const totalUsers = data.reduce((sum, d) => sum + d.total_users, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.total_revenue, 0);
    const totalPPCRevenue = data.reduce((sum, d) => sum + d.revenue_ppc, 0);
    const totalCommissions = data.reduce((sum, d) => sum + d.revenue_commissions, 0);

    // Estimate SaaS fees as 20% of commissions
    const saasFees = totalCommissions * 0.2;
    // Ad revenue is PPC revenue
    const adRevenue = totalPPCRevenue;
    // Total LTV sources = SaaS + Ad + Commissions
    const ltvSources = saasFees + adRevenue + totalCommissions;

    const cac = totalUsers > 0 ? totalAdSpend / totalUsers : 0;
    const avgRevenuePerUser = totalUsers > 0 ? ltvSources / totalUsers : 0;
    const retentionRate = 0.65;
    const ltv = avgRevenuePerUser * (1 / (1 - retentionRate));
    const healthRatio = cac > 0 ? ltv / cac : 0;

    // Revenue per click (estimate 5000 clicks per month)
    const totalClicks = 10000;
    const revenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;

    setMetrics({
      cac,
      ltv,
      healthRatio,
      isHealthy: ltv > 3 * cac,
      revenuePerClick,
      totalClicks,
      saasFees,
      adRevenue,
    });
  };

  useEffect(() => {
    if (financeData.length > 0) {
      calculateMetrics(financeData);
    }
  }, [financeData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Business Intelligence | AfterHoursID Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/super-admin" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-yellow-400 font-medium">Business Intelligence</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Business Intelligence</h1>
            <p className="text-gray-400 mt-2">Hidden admin dashboard for CAC, LTV, and revenue analysis</p>
          </div>

          {/* Business Health Score */}
          <div className={`mb-8 rounded-2xl p-6 border ${
            metrics.isHealthy 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Business Health Score</h2>
                <p className="text-sm text-gray-400">
                  Target: LTV {'>'} 3 × CAC
                </p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${
                  metrics.isHealthy ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metrics.isHealthy ? 'HEALTHY' : 'NEEDS IMPROVEMENT'}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  LTV:CAC Ratio: {metrics.healthRatio.toFixed(2)}x
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* CAC */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Customer Acquisition Cost</h3>
                <span className="text-yellow-400 text-xs">CAC</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.cac)}</p>
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full" 
                  style={{ width: `${Math.min(100, (metrics.cac / 100000) * 100)}%` }}
                />
              </div>
            </div>

            {/* LTV */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Lifetime Value</h3>
                <span className="text-yellow-400 text-xs">LTV</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</p>
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${Math.min(100, (metrics.ltv / 500000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Revenue Per Click */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Revenue Per Click</h3>
                <span className="text-yellow-400 text-xs">RPC</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.revenuePerClick)}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total Clicks: {metrics.totalClicks.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
                <span className="text-yellow-400 text-xs">REV</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(financeData.reduce((sum, d) => sum + d.total_revenue, 0))}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last {financeData.length} months
              </p>
            </div>
          </div>

          {/* Revenue Sources Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* LTV Components */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">LTV Components</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SaaS Fees</span>
                  <span className="font-semibold text-blue-400">
                    {formatCurrency(metrics.saasFees)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${metrics.ltv > 0 ? (metrics.saasFees / metrics.ltv) * 100 : 0}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-gray-400">Ad Revenue (PPC)</span>
                  <span className="font-semibold text-purple-400">
                    {formatCurrency(metrics.adRevenue)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${metrics.ltv > 0 ? (metrics.adRevenue / metrics.ltv) * 100 : 0}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-gray-400">Commissions</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(financeData.reduce((sum, d) => sum + d.revenue_commissions, 0))}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${metrics.ltv > 0 ? (financeData.reduce((sum, d) => sum + d.revenue_commissions, 0) / metrics.ltv) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Acquisition Funnel */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Acquisition Funnel</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Marketing Spend</span>
                    <span className="font-semibold">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.ad_spend, 0))}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">New Users Acquired</span>
                    <span className="font-semibold">
                      {financeData.reduce((sum, d) => sum + d.total_users, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Revenue Generated</span>
                    <span className="font-semibold">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.total_revenue, 0))}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: '80%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold">Monthly Financial Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ad Spend</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Users</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">CAC</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">PPC Rev</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Commissions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {financeData.map((row) => {
                    const cac = row.total_users > 0 ? row.ad_spend / row.total_users : 0;
                    return (
                      <tr key={row.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(row.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                          {formatCurrency(row.ad_spend)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {row.total_users.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-400">
                          {formatCurrency(cac)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-400">
                          {formatCurrency(row.revenue_ppc)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">
                          {formatCurrency(row.revenue_commissions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          {formatCurrency(row.total_revenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
