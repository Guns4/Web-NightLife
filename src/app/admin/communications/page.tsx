'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  Phone,
  Building,
  User,
  Download
} from 'lucide-react';

interface CommunicationLog {
  id: string;
  recipient_id: string;
  owner_name: string;
  venue_name: string;
  whatsapp_number: string;
  message_type: string;
  status: 'sent' | 'failed' | 'retry' | 'delivered' | 'read';
  error_message?: string;
  external_message_id?: string;
  sent_at: string;
  created_at: string;
}

interface Summary {
  total: number;
  sent: number;
  failed: number;
  success_rate: number;
}

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, sent: 0, failed: 0, success_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resending, setResending] = useState<string | null>(null);

  // Mock user - in production, get from auth
  const adminToken = 'mock-admin-token';

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      
      const response = await fetch(`/api/admin/communications/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (logId: string) => {
    setResending(logId);
    try {
      const response = await fetch('/api/admin/communications/logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
          log_id: logId,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Message resent successfully!');
        fetchLogs();
      } else {
        alert(`Failed to resend: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to resend:', error);
      alert('Failed to resend message');
    } finally {
      setResending(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
      read: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      retry: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    
    const labels: Record<string, string> = {
      sent: 'Sent',
      delivered: 'Delivered',
      read: 'Read',
      failed: 'Failed',
      retry: 'Retrying',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.sent}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-syne font-bold bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
                Communication Center
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Monitor WhatsApp onboarding messages
              </p>
            </div>
            
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Sent */}
          <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Onboarding Sent</p>
                <p className="text-2xl font-bold text-white">{summary.total}</p>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-xs">Success Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">{summary.success_rate}%</p>
                </div>
                <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]"
                    style={{ width: `${summary.success_rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="bg-gradient-to-br from-red-500/20 to-transparent border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Failed Messages</p>
                <p className="text-2xl font-bold text-red-400">{summary.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by venue name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#D4AF37]" />
                      <p className="mt-2">Loading communications...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      <MessageCircle className="w-8 h-8 mx-auto text-gray-600" />
                      <p className="mt-2">No communication logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-white">{log.owner_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">{log.venue_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300 font-mono text-sm">{log.whatsapp_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-sm">
                          {log.sent_at ? formatDate(log.sent_at) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleResend(log.id)}
                            disabled={resending === log.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            {resending === log.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
