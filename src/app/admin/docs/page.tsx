'use client';

import { useState } from 'react';
import { Book, ChevronRight, Copy, Check, Terminal, Database, Key, Globe, Shield, Clock } from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  auth?: boolean;
  body?: string;
  response?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  // Discovery APIs
  {
    method: 'GET',
    path: '/api/vibe-discovery',
    description: 'Discover venues based on filters (city, category, price, vibe)',
    category: 'Discovery',
    auth: false,
    response: `{
  "venues": [...],
  "pagination": { "page": 1, "limit": 20 }
}`
  },
  {
    method: 'GET',
    path: '/api/vibe/discovery',
    description: 'AI-powered venue discovery with smart recommendations',
    category: 'Discovery',
    auth: false,
  },
  
  // Booking APIs
  {
    method: 'POST',
    path: '/api/booking/reserve',
    description: 'Create a new venue reservation',
    category: 'Booking',
    auth: true,
    body: `{
  "venue_id": "uuid",
  "date": "2024-12-25",
  "time": "21:00",
  "pax": 4,
  "guest_name": "John Doe",
  "guest_phone": "+62812345678"
}`,
    response: `{
  "success": true,
  "reservation_id": "uuid",
  "confirmation_code": "NL-XXXXX"
}`
  },
  
  // Reviews APIs
  {
    method: 'POST',
    path: '/api/reviews/submit',
    description: 'Submit a venue review with optional receipt verification',
    category: 'Reviews',
    auth: true,
    body: `{
  "venue_id": "uuid",
  "rating": 5,
  "comment": "Amazing vibes!",
  "receipt_image_url": "https://...",
  "is_verified_visit": true
}`,
  },
  
  // PPC APIs
  {
    method: 'POST',
    path: '/api/ppc/increment',
    description: 'Increment PPC counter for venue analytics',
    category: 'Analytics',
    auth: false,
    body: `{
  "venue_id": "uuid",
  "source": "google"
}`,
  },
  
  // Cron APIs
  {
    method: 'GET',
    path: '/api/cron/promo-scheduler',
    description: 'Scheduled job to activate/deactivate promos',
    category: 'Cron Jobs',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/cron/auto-article',
    description: 'Generate AI-powered blog articles weekly',
    category: 'Cron Jobs',
    auth: false,
  },
  
  // AI APIs
  {
    method: 'POST',
    path: '/api/ai/verify-receipt',
    description: 'Verify receipt image using OpenAI Vision',
    category: 'AI',
    auth: false,
    body: `{
  "image_url": "https://cloudinary..."
}`,
    response: `{
  "is_valid": true,
  "confidence": 0.95,
  "message": "Receipt verified!"
}`
  },
];

const categories = ['All', ...new Set(apiEndpoints.map(e => e.category))];

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const filteredEndpoints = activeCategory === 'All' 
    ? apiEndpoints 
    : apiEndpoints.filter(e => e.category === activeCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'POST': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PUT': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">API Documentation</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Complete API reference for Nightlife.ID platform. Use these endpoints to integrate 
            with our venue discovery, booking, and review systems.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Links */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-yellow-500" />
                  Base URL
                </h3>
                <code className="block bg-gray-800 px-3 py-2 rounded text-sm text-gray-300">
                  https://nightlife.id
                </code>
              </div>

              {/* Authentication */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  Authentication
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  Most endpoints require Supabase JWT authentication.
                </p>
                <code className="block bg-gray-800 px-3 py-2 rounded text-xs text-gray-300">
                  Authorization: Bearer {'<token>'}
                </code>
              </div>

              {/* Rate Limiting */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Rate Limits
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Public: 100 req/min</li>
                  <li>• Authenticated: 200 req/min</li>
                  <li>• GPS Verify: 10 req/min</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Endpoints */}
            <div className="space-y-4">
              {filteredEndpoints.map((endpoint, index) => (
                <div 
                  key={`${endpoint.method}-${endpoint.path}-${index}`}
                  className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden"
                >
                  {/* Endpoint Header */}
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-gray-300 flex-1 font-mono">
                        {endpoint.path}
                      </code>
                      {endpoint.auth && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                          Auth Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">{endpoint.description}</p>
                  </div>

                  {/* Request Body */}
                  {endpoint.body && (
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          Request Body
                        </span>
                        <button
                          onClick={() => copyToClipboard(endpoint.body!, `body-${index}`)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedEndpoint === `body-${index}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-gray-800 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto">
                        <code>{endpoint.body}</code>
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  {endpoint.response && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Response
                        </span>
                        <button
                          onClick={() => copyToClipboard(endpoint.response!, `response-${index}`)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedEndpoint === `response-${index}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-gray-800 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto">
                        <code>{endpoint.response}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
