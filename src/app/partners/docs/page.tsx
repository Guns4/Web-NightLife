/**
 * =====================================================
 * PARTNER API DOCUMENTATION
 * AfterHoursID - Swagger/OpenAPI UI
 * =====================================================
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner API Documentation | AfterHoursID',
  description: 'B2B Partner API documentation for integrating nightlife content',
};

export default function PartnerAPIDocs() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black border-b border-gold-500/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gold-400">AfterHoursID Partner API</h1>
              <p className="text-gray-400">B2B Integration Documentation</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/partners/docs.json"
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded hover:border-gold-500 transition-colors"
              >
                OpenAPI JSON
              </a>
              <a
                href="/partners/portal"
                className="px-4 py-2 bg-gold-500 text-black font-medium rounded hover:bg-gold-400 transition-colors"
              >
                Partner Portal →
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Introduction</h2>
          <p className="text-gray-300 text-lg">
            The AfterHoursID Partner API allows third-party applications to access our nightlife 
            venue and promotional data. This API is designed for partners who want to integrate 
            our content into their own platforms.
          </p>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Authentication</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              All API requests require authentication using an API key. You can authenticate by:
            </p>
            <ul className="space-y-2 text-gray-300 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-gold-400">Header:</span>
                <code className="bg-gray-900 px-2 py-1 rounded">X-API-Key: your_api_key</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold-400">Authorization:</span>
                <code className="bg-gray-900 px-2 py-1 rounded">Bearer your_api_key</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold-400">Query:</span>
                <code className="bg-gray-900 px-2 py-1 rounded">?api_key=your_api_key</code>
              </li>
            </ul>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Rate Limits</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
              <p className="text-3xl font-bold text-gold-400">1,000</p>
              <p className="text-gray-400">requests/day</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-blue-500">
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-3xl font-bold text-blue-400">10,000</p>
              <p className="text-gray-400">requests/day</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-purple-500">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-3xl font-bold text-purple-400">100,000</p>
              <p className="text-gray-400">requests/day</p>
            </div>
          </div>
        </section>

        {/* Available Scopes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Available Scopes</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-300">Scope</th>
                  <th className="px-6 py-3 text-left text-gray-300">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-6 py-4 font-mono text-gold-400">read:venues</td>
                  <td className="px-6 py-4 text-gray-300">Access venue listings and details</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gold-400">read:promos</td>
                  <td className="px-6 py-4 text-gray-300">Access promotional content</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gold-400">read:events</td>
                  <td className="px-6 py-4 text-gray-300">Access event listings</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gold-400">read:analytics</td>
                  <td className="px-6 py-4 text-gray-300">Access analytics data</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gold-400">write:reservations</td>
                  <td className="px-6 py-4 text-gray-300">Create reservations on behalf of users</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">API Endpoints</h2>
          
          {/* Discovery */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Discovery</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 bg-green-900/30 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-500 text-black font-bold text-sm rounded">GET</span>
                  <code className="text-white">/api/v1/partners/discovery</code>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-300 mb-4">Fetch venues by city, category, or location.</p>
                <h4 className="text-white font-medium mb-2">Query Parameters</h4>
                <ul className="text-gray-400 text-sm space-y-1 font-mono">
                  <li>city (string) - Filter by city (jakarta, surabaya, bali)</li>
                  <li>category (string) - Filter by category (club, bar, lounge)</li>
                  <li>lat (number) - Latitude for geolocation</li>
                  <li>lng (number) - Longitude for geolocation</li>
                  <li>radius (number) - Search radius in meters (default: 5000)</li>
                  <li>limit (number) - Number of results (max: 100)</li>
                  <li>offset (number) - Pagination offset</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Promos Realtime */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Promos Realtime</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 bg-green-900/30 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-500 text-black font-bold text-sm rounded">GET</span>
                  <code className="text-white">/api/v1/partners/promos/realtime</code>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-300 mb-4">Fetch live promotional offers.</p>
                <h4 className="text-white font-medium mb-2">Query Parameters</h4>
                <ul className="text-gray-400 text-sm space-y-1 font-mono">
                  <li>venue_id (string) - Filter by venue</li>
                  <li>city (string) - Filter by city</li>
                  <li>category (string) - Filter by promo category</li>
                  <li>status (string) - Filter by status (active, expired)</li>
                  <li>limit (number) - Number of results (max: 100)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Response Format */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Response Format</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "venues": [...],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45
    }
  },
  "meta": {
    "partner": {
      "id": "partner-123",
      "name": "Partner Name",
      "tier": "professional"
    },
    "rateLimit": {
      "remaining": 9500,
      "reset": 1718400000
    }
  }
}`}
            </pre>
          </div>
        </section>

        {/* Widget Integration */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Widget Integration</h2>
          <p className="text-gray-300 mb-4">
            Add our cyberpunk-styled promo widget to your website with just a few lines of code:
          </p>
          <div className="bg-gray-800 rounded-lg p-6">
            <pre className="text-green-400 text-sm overflow-x-auto">
{`<script>
  (function(w,d,s,o,f,js,fjs){
    w['AfterHoursWidget']=o;
    w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','ahw','https://afterhours.id/partners/widget.js'));

  ahw('init', {
    partnerKey: 'ah_live_your_api_key',
    theme: 'cyberpunk', // or 'gold', 'minimal'
    position: 'bottom-right',
    city: 'jakarta'
  });
</script>`}
            </pre>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-3xl font-bold mb-4 text-gold-400">Support</h2>
          <p className="text-gray-300">
            Need help with integration? Contact our partner team at{' '}
            <a href="mailto:partners@afterhours.id" className="text-gold-400 hover:underline">
              partners@afterhours.id
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
