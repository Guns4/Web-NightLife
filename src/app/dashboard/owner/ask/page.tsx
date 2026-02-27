'use client';

import { useState } from 'react';

interface QueryResult {
  id: string;
  query: string;
  response: string;
  intent: string;
  confidence: number;
  sources: string[];
}

export default function AskNightLifePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryResult[]>([]);

  const exampleQueries = [
    "Kenapa Selasa malam ini lebih sepi dari biasanya?",
    "Berapa target promo untuk menarik lebih banyak tamu?",
    "Siapa kompetitor utama saya di area ini?",
    "Bagaimana performa bulan ini dibanding bulan lalu?",
    "Rekomendasikan strategi untuk weekend depan"
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response = '';
    let intent = '';
    let sources: string[] = [];
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('sepi') || lowerQuery.includes('low') || lowerQuery.includes('turun')) {
      intent = 'analyze_low_performance';
      response = `Analisis menunjukkan ada 3 faktor utama yang menyebabkan penurunan visitor:\n\n1. **Event Kompetitor**: there's a major concert event di radius 5km dari venue Anda yang menarik sekitar 30% dari visitor biasa Anda.\n\n2. **Promo Tetangga**: Kompetitor di sebelah (nama venue) sedang menjalankan promo \"Free Flow\" yang sangat menarik untuk segment young professional.\n\n3. **Cuaca**: Data historis menunjukkan hujan turun 40% lebih sering dari biasanya, yang mengurangi意愿 untuk keluar malam.\n\n**Rekomendasi**: Fokus pada strategi retention untuk customer existing dengan menawarkan exclusive experience.`;
      sources = ['Data historis 30 hari', 'Heatmap kompetitor', 'Data cuaca'];
    } else if (lowerQuery.includes('promo') || lowerQuery.includes('target') || lowerQuery.includes('murah')) {
      intent = 'recommend_promo';
      response = `Berdasarkan analisis data dan tren terkini, berikut rekomendasi promo untuk Anda:\n\n**1. Happy Hour Extension**\n- Extend happy hour dari jam 19:00-21:00 menjadi 18:00-22:00\n- Estimated reach: +150 visitors\n- Budget: Rp 2.500.000\n\n**2. Ladies Night Flash Promo**\n- Target: Female users, age 21-35\n- Offer: 50% off drinks sebelum jam 22:00\n- Estimated conversion: 35%\n\n**3. Bundle Deals**\n- Cocktail + Food pairing: Rp 150.000 (biasanya Rp 200.000)\n- Increase basket size by Rp 45.000 average`;
      sources = ['Tren pemesanan', 'Segmentasi user', 'Competitor analysis'];
    } else if (lowerQuery.includes('kompetitor') || lowerQuery.includes('tetangga') || lowerQuery.includes('saingan')) {
      intent = 'competitor_analysis';
      response = `Analisis kompetitor di area Senopati:\n\n**1. Club X (500m away)**\n- Rating: 4.3 ⭐\n- Average spend: Rp 350.000\n- Strength: Live DJ, younger crowd\n- Weakness: Parking\n\n**2. Bar Y (800m away)**\n- Rating: 4.1 ⭐\n- Average spend: Rp 200.000\n- Strength: Happy hour deals\n- Weakness: Space limited\n\n**Insight**: Venue Anda memiliki unique selling point di segment corporate/quality. Fokus pada this positioning.`;
      sources = ['Venue database', 'User reviews', 'Check-in data'];
    } else if (lowerQuery.includes('performa') || lowerQuery.includes('bulan') || lowerQuery.includes('revenue')) {
      intent = 'performance_analysis';
      response = `📊 Performa Venue Anda (30 Hari Terakhir):\n\n**Total Revenue**: Rp 847.500.000 (+12% vs bulan lalu)\n\n**Total Visits**: 2.847 visitor (+8% vs bulan lalu)\n\n**Peak Days**: \n- Saturday: 450 visitors\n- Friday: 380 visitors\n\n**Top Categories**:\n1. Premium Spirits: 45%\n2. Cocktails: 30%\n3. Beer: 25%\n\n**Customer Retention**: 68% (Above average 55%)`;
      sources = ['Revenue data', 'Check-in analytics', 'Customer profiles'];
    } else {
      intent = 'general_insight';
      response = `Berdasarkan data analytics venue Anda:\n\nVenue Anda berada di 15% teratas dari semua venue di district Senopati dalam hal visitor count dan 20% teratas dalam average spend.\n\nUntuk meningkatkan performa, saya sarankan:\n1. Tingkatkan Instagram presence dengan collaborate dengan local influencers\n2. Consider adding a signature event night\n3. Implement loyalty program untuk regular customers`;
      sources = ['Benchmark data', 'Industry trends'];
    }
    
    const newResult: QueryResult = {
      id: Date.now().toString(),
      query,
      response,
      intent,
      confidence: 0.87,
      sources
    };
    
    setResult(newResult);
    setHistory(prev => [newResult, ...prev]);
    setQuery('');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🤖</div>
          <h1 className="text-3xl font-bold mb-2">Ask NightLife</h1>
          <p className="text-purple-300">Tanya apa saja tentang venue Anda dalam Bahasa Indonesia</p>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Kenapa Selasa malam ini lebih sepi dari biasanya?"
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4 pr-14 text-lg focus:outline-none focus:border-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 p-3 rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Example Queries */}
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-3">Contoh pertanyaan:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((ex, i) => (
              <button
                key={i}
                onClick={() => setQuery(ex)}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-sm text-gray-300"
                disabled={loading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-purple-300">
                    {result.intent.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{result.response}</div>
                <div className="mt-4 flex gap-2">
                  {result.sources.map((source, i) => (
                    <span key={i} className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
                      📊 {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Riwayat Pertanyaan</h3>
            <div className="space-y-2">
              {history.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setResult(item)}
                  className="w-full text-left bg-gray-800/50 hover:bg-gray-800 p-3 rounded-xl border border-gray-700/50"
                >
                  <div className="text-sm truncate">{item.query}</div>
                  <div className="text-xs text-gray-500">
                    {item.intent.replace(/_/g, ' ')} • {(item.confidence * 100).toFixed(0)}% confidence
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
