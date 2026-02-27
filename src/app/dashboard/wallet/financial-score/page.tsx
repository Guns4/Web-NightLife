'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FinancialProfile {
  lifestyle_score: number;
  score_tier: string;
  total_spent_30d: number;
  total_spent_90d: number;
  avg_transaction: number;
  visit_consistency_score: number;
  no_show_count: number;
  cancellation_count: number;
  total_bookings: number;
  bnpl_eligible: boolean;
  bnpl_limit: number;
  current_bnpl_balance: number;
}

interface BNPLTransaction {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

export default function FinancialScorePage() {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [transactions, setTransactions] = useState<BNPLTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  async function loadFinancialData() {
    setLoading(true);
    
    // Mock data for demo
    const mockProfile: FinancialProfile = {
      lifestyle_score: 742,
      score_tier: 'gold',
      total_spent_30d: 8500000,
      total_spent_90d: 22000000,
      avg_transaction: 750000,
      visit_consistency_score: 0.85,
      no_show_count: 0,
      cancellation_count: 2,
      total_bookings: 32,
      bnpl_eligible: true,
      bnpl_limit: 5000000,
      current_bnpl_balance: 0
    };
    
    const mockTransactions: BNPLTransaction[] = [
      { id: '1', amount: 1200000, status: 'paid', due_date: '2026-02-01', created_at: '2026-01-15' },
      { id: '2', amount: 850000, status: 'paid', due_date: '2026-01-15', created_at: '2026-01-01' },
      { id: '3', amount: 2100000, status: 'paid', due_date: '2025-12-15', created_at: '2025-12-01' }
    ];
    
    setProfile(mockProfile);
    setTransactions(mockTransactions);
    setLoading(false);
  }

  function getScoreColor(score: number): string {
    if (score >= 750) return 'text-green-400';
    if (score >= 650) return 'text-blue-400';
    if (score >= 550) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getScoreTierBadge(tier: string) {
    const badges: Record<string, { bg: string; text: string }> = {
      platinum: { bg: 'bg-gray-300/20', text: 'text-gray-200' },
      gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
      silver: { bg: 'bg-gray-400/20', text: 'text-gray-300' },
      standard: { bg: 'bg-gray-600/20', text: 'text-gray-400' }
    };
    return badges[tier] || badges.standard;
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">💳 Financial Score</h1>
          <p className="text-purple-300">Your lifestyle credit and BNPL eligibility</p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-sm text-purple-300 mb-1">Your Lifestyle Score</div>
              <div className={`text-6xl font-bold ${getScoreColor(profile!.lifestyle_score)}`}>
                {profile!.lifestyle_score}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreTierBadge(profile!.score_tier).bg} ${getScoreTierBadge(profile!.score_tier).text}`}>
              {profile!.score_tier.toUpperCase()} MEMBER
            </span>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+150</div>
              <div className="text-xs text-gray-400">Spending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+120</div>
              <div className="text-xs text-gray-400">Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+80</div>
              <div className="text-xs text-gray-400">Reliability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">-0</div>
              <div className="text-xs text-gray-400">Penalties</div>
            </div>
          </div>

          {/* Progress to next tier */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to Platinum</span>
              <span className="text-purple-400">{(profile!.lifestyle_score - 750) + 50}/50</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${Math.min(((profile!.lifestyle_score - 750) + 50) / 50 * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* BNPL Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* BNPL Eligibility */}
          <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Buy Now, Pay Later</h3>
            
            {profile!.bnpl_eligible ? (
              <>
                <div className="mb-4">
                  <div className="text-sm text-gray-400">Available Limit</div>
                  <div className="text-3xl font-bold text-green-400">
                    Rp {(profile!.bnpl_limit - profile!.current_bnpl_balance).toLocaleString('id-ID')}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Limit</span>
                    <span>Rp {profile!.bnpl_limit.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Balance</span>
                    <span>Rp {profile!.current_bnpl_balance.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(profile!.current_bnpl_balance / profile!.bnpl_limit) * 100}%` }}
                  />
                </div>
                
                <button className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold">
                  Apply BNPL
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🔒</div>
                <div className="text-gray-400 mb-4">BNPL not yet available</div>
                <p className="text-sm text-gray-500">
                  Increase your score by booking consistently and avoiding no-shows
                </p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Spent (30 days)</span>
                <span className="font-medium">Rp {profile!.total_spent_30d.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Spent (90 days)</span>
                <span className="font-medium">Rp {profile!.total_spent_90d.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg. Transaction</span>
                <span className="font-medium">Rp {profile!.avg_transaction.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Visit Consistency</span>
                <span className="font-medium text-green-400">{(profile!.visit_consistency_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">No-Shows</span>
                <span className={`font-medium ${profile!.no_show_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {profile!.no_show_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cancellations</span>
                <span className={`font-medium ${profile!.cancellation_count > 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {profile!.cancellation_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bookings</span>
                <span className="font-medium">{profile!.total_bookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">BNPL Repayment History</h3>
          
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <div>
                  <div className="font-medium">Rp {tx.amount.toLocaleString('id-ID')}</div>
                  <div className="text-xs text-gray-400">Due: {tx.due_date}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  tx.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                  tx.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                  tx.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-purple-900/20 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold mb-4">💡 Tips to Improve Your Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-medium">Book Consistently</div>
              <div className="text-sm text-gray-400">Visit venues regularly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium">Honor Reservations</div>
              <div className="text-sm text-gray-400">Zero no-shows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium">Pay On Time</div>
              <div className="text-sm text-gray-400">Repay BNPL promptly</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
