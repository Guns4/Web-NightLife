'use client';

import { useState, useEffect } from 'react';

export default function GovernmentDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  🇮🇩
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Wonderful Indonesia - Nightlife Analytics</h1>
                  <p className="text-blue-200">Strategic Tourism Intelligence Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-blue-400 text-sm">Total Nightlife Visitors</div>
            <div className="text-2xl font-bold">2.4M</div>
            <div className="text-green-400 text-xs">↑ 18% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-green-400 text-sm">Economic Impact</div>
            <div className="text-2xl font-bold">Rp 840T</div>
            <div className="text-green-400 text-xs">↑ 22% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-purple-400 text-sm">International Tourists</div>
            <div className="text-2xl font-bold">847K</div>
            <div className="text-green-400 text-xs">↑ 35% vs last month</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-yellow-400 text-sm">Safety Score</div>
            <div className="text-2xl font-bold">4.7/5</div>
            <div className="text-green-400 text-xs">↑ 0.2 vs last month</div>
          </div>
        </div>

        {/* Regional Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Regional Tourism Flow</h3>
            <div className="space-y-3">
              {[
                { region: 'Bali & Nusa Tenggara', visitors: 850000, revenue: 'Rp 280T', international: '42%' },
                { region: 'Jakarta & Greater Jakarta', visitors: 720000, revenue: 'Rp 320T', international: '28%' },
                { region: 'East Java (Surabaya, Malang)', visitors: 380000, revenue: 'Rp 95T', international: '12%' },
                { region: 'West Java (Bandung, Bekasi)', visitors: 290000, revenue: 'Rp 72T', international: '8%' },
                { region: 'North Sumatra (Medan)', visitors: 160000, revenue: 'Rp 48T', international: '10%' }
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/50">
                  <div>
                    <div className="font-medium">{r.region}</div>
                    <div className="text-xs text-gray-400">{r.international} international</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{r.visitors.toLocaleString()}</div>
                    <div className="text-xs text-green-400">{r.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Economic Impact */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Economic Impact Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Direct Spending</span>
                  <span className="text-green-400">Rp 520T</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tax Revenue (PB1)</span>
                  <span className="text-blue-400">Rp 156T</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Employment Income</span>
                  <span className="text-purple-400">Rp 98T</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Vendor/Supply Chain</span>
                  <span className="text-yellow-400">Rp 66T</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '8%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Satisfaction */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Safety Incidents</h3>
            <div className="text-4xl font-bold text-green-400 mb-2">99.2%</div>
            <div className="text-sm text-gray-400">Incident-free visits</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Medical</span>
                <span className="text-green-400">0.3%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Safety Concerns</span>
                <span className="text-yellow-400">0.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Harassment Reports</span>
                <span className="text-red-400">0.1%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Tourist Satisfaction</h3>
            <div className="text-4xl font-bold text-purple-400 mb-2">4.6/5</div>
            <div className="text-sm text-gray-400">Average rating</div>
            <div className="mt-4 space-y-2">
              {[
                { category: 'Entertainment', rating: 4.7 },
                { category: 'Service', rating: 4.5 },
                { category: 'Value', rating: 4.3 },
                { category: 'Safety', rating: 4.8 }
              ].map(c => (
                <div key={c.category} className="flex justify-between text-sm">
                  <span>{c.category}</span>
                  <span className="text-purple-400">{c.rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Top Venue Categories</h3>
            <div className="space-y-3">
              {[
                { category: 'Beach Clubs', visits: '420K', growth: '+28%' },
                { category: 'Night Clubs', visits: '380K', growth: '+15%' },
                { category: 'Live Music', visits: '290K', growth: '+22%' },
                { category: 'Rooftop Bars', visits: '245K', growth: '+35%' }
              ].map(c => (
                <div key={c.category} className="flex justify-between items-center">
                  <span className="text-sm">{c.category}</span>
                  <div className="text-right">
                    <div className="text-sm">{c.visits}</div>
                    <div className="text-xs text-green-400">{c.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Access Info */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">📡 API Access for Partners</h3>
          <p className="text-gray-400 text-sm mb-4">
            Government agencies and tourism partners can access real-time data via our API.
          </p>
          <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm">
            <div className="text-gray-400"># API Endpoint</div>
            <div className="text-green-400">GET https://api.nightlife.id/gov/v1/tourism-flow</div>
            <div className="text-gray-400 mt-2"># Sample Response</div>
            <div className="text-blue-400">{'{'}</div>
            <div className="text-blue-400">  "region": "Bali",</div>
            <div className="text-blue-400">  "visitors": 850000,</div>
            <div className="text-blue-400">  "safety_score": 4.7</div>
            <div className="text-blue-400">{'}'}</div>
          </div>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
            Request API Access
          </button>
        </div>
      </div>
    </div>
  );
}
