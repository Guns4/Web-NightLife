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

interface UnitEconomics {
  cac: number;
  ltv: number;
  healthRatio: number;
  isHealthy: boolean;
}

// Default mock data for demonstration
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

export default function AdminFinancePage() {
  const [financeData, setFinanceData] = useState<FinanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomics>({
    cac: 0,
    ltv: 0,
    healthRatio: 0,
    isHealthy: false,
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
        // Use mock data for demonstration
        setFinanceData(defaultFinanceData);
      } else if (data && data.length > 0) {
        setFinanceData(data);
      } else {
        // Use mock data if no data available
        setFinanceData(defaultFinanceData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setFinanceData(defaultFinanceData);
    } finally {
      setLoading(false);
    }
  };

  // Calculate unit economics
  const calculateUnitEconomics = (data: FinanceData[]) => {
    if (data.length === 0) return;

    const totalAdSpend = data.reduce((sum, d) => sum + d.ad_spend, 0);
    const totalUsers = data.reduce((sum, d) => sum + d.total_users, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.total_revenue, 0);

    const cac = totalUsers > 0 ? totalAdSpend / totalUsers : 0;
    const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const retentionRate = 0.65; // Default 65% retention
    const ltv = avgRevenuePerUser * (1 / (1 - retentionRate)); // Simplified LTV
    const healthRatio = cac > 0 ? ltv / cac : 0;

    setUnitEconomics({
      cac,
      ltv,
      healthRatio,
      isHealthy: ltv > 3 * cac,
    });
  };

  useEffect(() => {
    if (financeData.length > 0) {
      calculateUnitEconomics(financeData);
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
        <title>Finance Analytics | AfterHoursID Admin</title>
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
                <span className="text-yellow-400 font-medium">Finance Analytics</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Unit Economics Dashboard</h1>
            <p className="text-gray-400 mt-2">Track CAC, LTV, and business health metrics</p>
          </div>

          {/* Business Health Indicator */}
          <div className={`mb-8 rounded-2xl p-6 border ${
            unitEconomics.isHealthy 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Business Health</h2>
                <p className="text-sm text-gray-400">
                  LTV {unitEconomics.isHealthy ? '>' : '<'} 3 × CAC
                </p>
              </div>
              <div className={`text-3xl font-bold ${
                unitEconomics.isHealthy ? 'text-green-400' : 'text-red-400'
              }`}>
                {unitEconomics.isHealthy ? 'HEALTHY' : 'NEEDS IMPROVEMENT'}
              </div>
            </div>
          </div>

          {/* Unit Economics Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Customer Acquisition Cost</h3>
                <span className="text-yellow-400 text-xs">CAC</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(unitEconomics.cac)}</p>
              <p className="text-sm text-gray-500 mt-2">Cost to acquire one new user</p>
            </div>

            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Lifetime Value</h3>
                <span className="text-yellow-400 text-xs">LTV</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(unitEconomics.ltv)}</p>
              <p className="text-sm text-gray-500 mt-2">Projected revenue per user</p>
            </div>

            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Health Ratio</h3>
                <span className="text-yellow-400 text-xs">LTV:CAC</span>
              </div>
              <p className="text-2xl font-bold">{unitEconomics.healthRatio.toFixed(2)}x</p>
              <p className="text-sm text-gray-500 mt-2">
                {unitEconomics.isHealthy 
                  ? 'Excellent - LTV exceeds 3x CAC' 
                  : 'Target: LTV should exceed 3x CAC'}
              </p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Total Ad Spend</h3>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(financeData.reduce((sum, d) => sum + d.ad_spend, 0))}
              </p>
              <p className="text-sm text-gray-500 mt-2">Marketing investment</p>
            </div>

            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Revenue (PPC)</h3>
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(financeData.reduce((sum, d) => sum + d.revenue_ppc, 0))}
              </p>
              <p className="text-sm text-gray-500 mt-2">Pay-per-click revenue</p>
            </div>

            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Revenue (Commissions)</h3>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(financeData.reduce((sum, d) => sum + d.revenue_commissions, 0))}
              </p>
              <p className="text-sm text-gray-500 mt-2">Commission earnings</p>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ad Spend</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">PPC Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {financeData.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(row.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                        {formatCurrency(row.ad_spend)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                        {row.total_users.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-400">
                        {formatCurrency(row.revenue_ppc)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">
                        {formatCurrency(row.revenue_commissions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-yellow-400">
                        {formatCurrency(row.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-black/50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-400">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.ad_spend, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-white">
                      {financeData.reduce((sum, d) => sum + d.total_users, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-400">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.revenue_ppc, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-400">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.revenue_commissions, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-yellow-400">
                      {formatCurrency(financeData.reduce((sum, d) => sum + d.total_revenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
