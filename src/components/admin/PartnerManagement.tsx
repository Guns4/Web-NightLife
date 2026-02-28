/**
 * =====================================================
 * PARTNER MANAGEMENT COMPONENT
 * AfterHoursID - Admin Dashboard
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';

// Types
interface Partner {
  id: string;
  name: string;
  slug: string;
  email: string;
  tier: 'basic' | 'professional' | 'enterprise';
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  total_requests: number;
  monthly_requests: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_quota: number;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

export default function PartnerManagement() {
  const [activeTab, setActiveTab] = useState<'partners' | 'keys' | 'analytics'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async (partnerId: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/keys`);
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadLogs = async (partnerId: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/logs`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const selectPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    loadApiKeys(partner.id);
    loadLogs(partner.id);
  };

  const createApiKey = async () => {
    if (!selectedPartner || !newKeyName) return;
    
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      
      if (data.plain_key) {
        alert(`API Key Created!\n\nSave this key - it will not be shown again:\n\n${data.plain_key}`);
      }
      
      loadApiKeys(selectedPartner.id);
      setShowCreateModal(false);
      setNewKeyName('');
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!selectedPartner || !confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      await fetch(`/api/admin/partners/${selectedPartner.id}/keys?id=${keyId}`, {
        method: 'DELETE',
      });
      loadApiKeys(selectedPartner.id);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-600',
      professional: 'bg-blue-600',
      enterprise: 'bg-purple-600',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold-400">Partner Management</h1>
        <p className="text-gray-400">Manage B2B partners, API keys, and monitor usage</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        {(['partners', 'keys', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'text-gold-400 border-b-2 border-gold-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Partner List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Partners</h2>
            <div className="space-y-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => selectPartner(partner)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedPartner?.id === partner.id
                      ? 'bg-gold-500/20 border border-gold-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">{partner.name}</div>
                      <div className="text-sm text-gray-400">{partner.email}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(partner.status)} text-white`}>
                      {partner.status}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTierBadge(partner.tier)} text-white`}>
                      {partner.tier}
                    </span>
                    <span className="text-xs text-gray-400">
                      {partner.monthly_requests.toLocaleString()} req/mo
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            {selectedPartner ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedPartner.name}</h2>
                    <p className="text-gray-400">{selectedPartner.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                      Suspend
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gold-400">
                      {selectedPartner.total_requests.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Total Requests</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedPartner.monthly_requests.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">This Month</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{apiKeys.length}</div>
                    <div className="text-sm text-gray-400">API Keys</div>
                  </div>
                </div>

                {/* API Keys Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">API Keys</h3>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-gold-500 text-black font-medium rounded hover:bg-gold-400"
                    >
                      + New Key
                    </button>
                  </div>
                  <div className="space-y-2">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{key.name}</div>
                          <div className="text-sm text-gray-400">
                            {key.key_prefix}... • {key.scopes.join(', ')} • {key.rate_limit_quota.toLocaleString()}/day
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${key.is_active ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                            {key.is_active ? 'Active' : 'Revoked'}
                          </span>
                          {key.is_active && (
                            <button
                              onClick={() => revokeApiKey(key.id)}
                              className="px-2 py-1 bg-red-600 rounded text-xs text-white hover:bg-red-700"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Logs */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Recent API Calls</h3>
                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-600 text-gray-300">
                        <tr>
                          <th className="px-4 py-2 text-left">Endpoint</th>
                          <th className="px-4 py-2 text-left">Method</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Response Time</th>
                          <th className="px-4 py-2 text-left">Time</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        {logs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="border-t border-gray-600">
                            <td className="px-4 py-2 font-mono text-xs">{log.endpoint}</td>
                            <td className="px-4 py-2">{log.method}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                log.status_code < 300 ? 'bg-green-500' :
                                log.status_code < 400 ? 'bg-yellow-500' : 'bg-red-500'
                              } text-white`}>
                                {log.status_code}
                              </span>
                            </td>
                            <td className="px-4 py-2">{log.response_time_ms}ms</td>
                            <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-12">
                Select a partner to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create New API Key</h3>
            <input
              type="text"
              placeholder="Key name (e.g., Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={createApiKey}
                className="flex-1 px-4 py-2 bg-gold-500 text-black font-medium rounded hover:bg-gold-400"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
