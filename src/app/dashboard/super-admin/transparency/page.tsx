'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TransparencySummary {
  total_reviews: number;
  verified_reviews: number;
  unverified_reviews: number;
  trust_score: number;
}

interface TrendData {
  month: string;
  total: number;
  verified: number;
  percentage: number;
}

interface UnverifiedReview {
  id: string;
  user: string;
  venue: string;
  rating: number;
  comment: string | null;
  distance: number | null;
  created_at: string;
  has_gps: boolean;
}

export default function TransparencyDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TransparencySummary>({
    total_reviews: 0,
    verified_reviews: 0,
    unverified_reviews: 0,
    trust_score: 0
  });
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [recentUnverified, setRecentUnverified] = useState<UnverifiedReview[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch transparency data
      const response = await fetch('/api/admin/analytics/transparency', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch data');
      }

      const data = await response.json();
      
      setSummary(data.summary);
      setTrend(data.trend || []);
      setRecentUnverified(data.recent_unverified || []);

    } catch (error: any) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualVerify = async (reviewId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/reviews/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ review_id: reviewId })
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error('Error verifying review:', error);
    }
  };

  const generatePDF = () => {
    // Simple PDF generation - in production use a library like jsPDF or react-pdf
    const reportContent = `
AFTERHOURS ID - REVIEW TRANSPARENCY REPORT
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
=================
Total Reviews: ${summary.total_reviews}
Verified Reviews: ${summary.verified_reviews}
Unverified Reviews: ${summary.unverified_reviews}
Trust Score: ${summary.trust_score}%

MONTHLY TREND
=============
${trend.map(t => `${t.month}: ${t.verified}/${t.total} verified (${t.percentage}%)`).join('\n')}

RECENT UNVERIFIED REVIEWS
========================
${recentUnverified.map(r => `- ${r.user} at ${r.venue} (Rating: ${r.rating}) - Distance: ${r.distance ? r.distance + 'm' : 'N/A'}`).join('\n')}

---
AfterHours ID - Nightlife Intelligence Platform
    `.trim();

    // Create and download a text file (in production this would be a proper PDF)
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transparency-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400">This page is only accessible to SUPER_ADMIN users.</p>
      </div>
    );
  }

  // Calculate chart data
  const verifiedPercentage = summary.total_reviews > 0 
    ? Math.round((summary.verified_reviews / summary.total_reviews) * 100) 
    : 0;
  const unverifiedPercentage = 100 - verifiedPercentage;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Review Integrity Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Monitor verified vs unverified reviews for transparency
              </p>
            </div>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg border border-amber-500/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Reviews */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Total Reviews</p>
            <p className="text-3xl font-bold text-white mt-1">{summary.total_reviews.toLocaleString()}</p>
          </div>

          {/* Verified Reviews */}
          <div className="bg-gray-900 rounded-xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-amber-400 text-sm font-medium">Verified</span>
            </div>
            <p className="text-gray-400 text-sm">Verified Reviews</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{summary.verified_reviews.toLocaleString()}</p>
          </div>

          {/* Trust Score */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Average Trust Score</p>
            <p className="text-3xl font-bold text-white mt-1">{summary.trust_score}%</p>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${summary.trust_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Donut Chart - Verified vs Unverified */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-6">Verification Status</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#1f2937"
                    strokeWidth="3"
                  />
                  {/* Verified circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray={`${verifiedPercentage}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{verifiedPercentage}%</span>
                  <span className="text-gray-400 text-sm">Verified</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                <span className="text-gray-400 text-sm">Verified ({summary.verified_reviews})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="text-gray-400 text-sm">Unverified ({summary.unverified_reviews})</span>
              </div>
            </div>
          </div>

          {/* Integrity Trend - Line Chart */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-6">Integrity Trend</h2>
            <div className="h-48">
              {trend.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-2">
                  {trend.slice(-6).map((item, index) => {
                    const height = item.total > 0 ? (item.verified / item.total) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all duration-300"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div 
                            className="w-full bg-gray-700 rounded-t"
                            style={{ height: `${100 - height}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs mt-2">{item.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded"></div>
                <span className="text-gray-400">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-700 rounded"></div>
                <span className="text-gray-400">Unverified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Unverified Reviews Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Unverified Reviews</h2>
            <p className="text-gray-400 text-sm mt-1">Last 10 unverified reviews requiring attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">Venue</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">Rating</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">Distance</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentUnverified.length > 0 ? (
                  recentUnverified.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm text-gray-300">{review.user.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-white text-sm">{review.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate">{review.venue}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {review.distance ? (
                          <span className={`text-sm ${review.distance > 100 ? 'text-red-400' : 'text-gray-400'}`}>
                            {review.distance}m
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">No GPS</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleManualVerify(review.id)}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors"
                        >
                          Manual Verify
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No unverified reviews found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
