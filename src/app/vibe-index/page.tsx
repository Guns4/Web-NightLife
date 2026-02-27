'use client';

import { useState, useEffect } from 'react';

interface DistrictData {
  district: string;
  city: string;
  vibeIndex: number;
  safetyIndex: number;
  energyIndex: number;
  trend: 'rising' | 'falling' | 'stable';
  avgRent: number;
  roi1yr: number;
  roi3yr: number;
  opportunity: number;
}

export default function VibeIndexPage() {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    // Mock data
    setDistricts([
      { district: 'SCBD', city: 'Jakarta', vibeIndex: 92, safetyIndex: 88, energyIndex: 95, trend: 'rising', avgRent: 350000000, roi1yr: 24.5, roi3yr: 78.2, opportunity: 72 },
      { district: 'Kemang', city: 'Jakarta', vibeIndex: 88, safetyIndex: 85, energyIndex: 90, trend: 'rising', avgRent: 280000000, roi1yr: 21.2, roi3yr: 68.5, opportunity: 68 },
      { district: 'Senopati', city: 'Jakarta', vibeIndex: 85, safetyIndex: 82, energyIndex: 88, trend: 'stable', avgRent: 220000000, roi1yr: 18.5, roi3yr: 58.2, opportunity: 75 },
      { district: 'Seminyak', city: 'Bali', vibeIndex: 95, safetyIndex: 90, energyIndex: 98, trend: 'rising', avgRent: 450000000, roi1yr: 28.5, roi3yr: 92.0, opportunity: 85 },
      { district: 'Canggu', city: 'Bali', vibeIndex: 90, safetyIndex: 88, energyIndex: 92, trend: 'rising', avgRent: 320000000, roi1yr: 25.0, roi3yr: 82.5, opportunity: 80 },
      { district: 'Legian', city: 'Bali', vibeIndex: 82, safetyIndex: 85, energyIndex: 80, trend: 'stable', avgRent: 180000000, roi1yr: 15.2, roi3yr: 48.5, opportunity: 55 },
      { district: 'Surabaya - West', city: 'Surabaya', vibeIndex: 78, safetyIndex: 80, energyIndex: 75, trend: 'rising', avgRent: 150000000, roi1yr: 12.5, roi3yr: 42.0, opportunity: 62 },
      { district: 'Bandung - Dago', city: 'Bandung', vibeIndex: 75, safetyIndex: 85, energyIndex: 72, trend: 'stable', avgRent: 120000000, roi1yr: 10.2, roi3yr: 35.5, opportunity: 58 },
      { district: 'Medan - Merdeka', city: 'Medan', vibeIndex: 68, safetyIndex: 72, energyIndex: 65, trend: 'rising', avgRent: 95000000, roi1yr: 8.5, roi3yr: 28.0, opportunity: 45 },
      { district: 'Makassar - Losari', city: 'Makassar', vibeIndex: 65, safetyIndex: 70, energyIndex: 62, trend: 'stable', avgRent: 85000000, roi1yr: 7.2, roi3yr: 24.5, opportunity: 42 }
    ]);
    setLoading(false);
  }, []);

  const filteredDistricts = selectedCity === 'all' 
    ? districts 
    : districts.filter(d => d.city.toLowerCase() === selectedCity.toLowerCase());

  const cities = ['all', ...new Set(districts.map(d => d.city))];

  function getVibeColor(index: number) {
    if (index >= 85) return 'text-green-400';
    if (index >= 70) return 'text-yellow-400';
    if (index >= 50) return 'text-orange-400';
    return 'text-red-400';
  }

  function getTrendIcon(trend: string) {
    if (trend === 'rising') return '↗️';
    if (trend === 'falling') return '↘️';
    return '→';
  }

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
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  📈
                </div>
                <div>
                  <h1 className="text-2xl font-bold">The Vibe Index</h1>
                  <p className="text-emerald-200">Nightlife Commercial Real Estate Intelligence</p>
                </div>
              </div>
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2"
            >
              {cities.map(city => (
                <option key={city} value={city}>
                  {city === 'all' ? 'All Cities' : city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-emerald-400 text-sm">Active Districts</div>
            <div className="text-2xl font-bold">{districts.length}</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-green-400 text-sm">Avg. ROI (1yr)</div>
            <div className="text-2xl font-bold">18.5%</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-blue-400 text-sm">Rising Districts</div>
            <div className="text-2xl font-bold">{districts.filter(d => d.trend === 'rising').length}</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-purple-400 text-sm">Avg. Opportunity</div>
            <div className="text-2xl font-bold">62%</div>
          </div>
        </div>

        {/* District Rankings */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">District Rankings</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Rank</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">District</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Vibe Index</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Safety</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Energy</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Trend</th>
                <th className="px-4 py-3 text-right text-sm text-gray-400">Est. Rent/Mo</th>
                <th className="px-4 py-3 text-right text-sm text-gray-400">ROI (1yr)</th>
                <th className="px-4 py-3 text-right text-sm text-gray-400">Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredDistricts.sort((a, b) => b.vibeIndex - a.vibeIndex).map((d, i) => (
                <tr key={d.district} className="hover:bg-gray-700/30">
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
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.district}</div>
                    <div className="text-xs text-gray-400">{d.city}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xl font-bold ${getVibeColor(d.vibeIndex)}`}>
                      {d.vibeIndex}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {d.safetyIndex}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {d.energyIndex}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      d.trend === 'rising' ? 'bg-green-500/20 text-green-300' :
                      d.trend === 'falling' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {getTrendIcon(d.trend)} {d.trend}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    Rp {(d.avgRent / 1000000).toFixed(0)}jt
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-400">{d.roi1yr}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={d.opportunity >= 70 ? 'text-green-400' : d.opportunity >= 50 ? 'text-yellow-400' : 'text-orange-400'}>
                        {d.opportunity}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Investment Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Opportunities */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">🔥 Top Investment Opportunities</h3>
            <div className="space-y-3">
              {filteredDistricts
                .filter(d => d.trend === 'rising')
                .sort((a, b) => b.opportunity - a.opportunity)
                .slice(0, 3)
                .map(d => (
                  <div key={d.district} className="flex justify-between items-center py-3 border-b border-gray-700/50">
                    <div>
                      <div className="font-medium">{d.district}, {d.city}</div>
                      <div className="text-xs text-gray-400">ROI 3yr: {d.roi3yr}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{d.opportunity}%</div>
                      <div className="text-xs text-gray-400">Opportunity Score</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Emerging Districts */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">⭐ Emerging Districts</h3>
            <div className="space-y-3">
              {filteredDistricts
                .filter(d => d.vibeIndex < 75 && d.trend === 'rising')
                .slice(0, 3)
                .map(d => (
                  <div key={d.district} className="flex justify-between items-center py-3 border-b border-gray-700/50">
                    <div>
                      <div className="font-medium">{d.district}, {d.city}</div>
                      <div className="text-xs text-gray-400">Entry: Rp {(d.avgRent / 1000000).toFixed(0)}jt/mo</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold">↗️ Rising</div>
                      <div className="text-xs text-gray-400">Growth Potential</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Commercial API */}
        <div className="bg-emerald-900/20 rounded-xl p-6 border border-emerald-500/30">
          <h3 className="text-lg font-semibold mb-4">📡 Commercial Real Estate API</h3>
          <p className="text-gray-400 text-sm mb-4">
            Access programmatic data for your applications and research.
          </p>
          <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm mb-4">
            <div className="text-gray-400"># Get district data</div>
            <div className="text-emerald-400">GET https://api.nightlife.id/v1/vibe-index</div>
            <div className="text-gray-400 mt-2"># Response</div>
            <div className="text-blue-400">{'{'}</div>
            <div className="text-blue-400">  "district": "SCBD",</div>
            <div className="text-blue-400">  "vibe_index": 92,</div>
            <div className="text-blue-400">  "roi_1yr": 24.5</div>
            <div className="text-blue-400">{'}'}</div>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg">
            Get API Access
          </button>
        </div>
      </div>
    </div>
  );
}
