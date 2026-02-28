/**
 * =====================================================
 * AUDIT LOGS
 * Track all admin write actions
 * =====================================================
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  User, 
  Edit, 
  Trash2, 
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  ChevronRight
} from "lucide-react";

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

const mockLogs: AuditLog[] = [
  {
    id: "1",
    adminId: "admin-1",
    adminName: "Super Admin",
    action: "PRICE_TIER_CHANGE",
    entityType: "venue",
    entityId: "venue-jakarta-1",
    changes: { old: "TIER_2", new: "TIER_1" },
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    ipAddress: "192.168.1.1",
  },
  {
    id: "2",
    adminId: "admin-2",
    adminName: "Content Moderator",
    action: "USER_BAN",
    entityType: "user",
    entityId: "user-123",
    changes: { reason: "Fake reviews", duration: "permanent" },
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ipAddress: "192.168.1.2",
  },
  {
    id: "3",
    adminId: "admin-1",
    adminName: "Super Admin",
    action: "VENUE_VERIFICATION",
    entityType: "venue",
    entityId: "venue-bali-2",
    changes: { old: "pending", new: "verified" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    ipAddress: "192.168.1.1",
  },
  {
    id: "4",
    adminId: "admin-3",
    adminName: "Finance Admin",
    action: "REFUND_APPROVAL",
    entityType: "transaction",
    entityId: "tx-456",
    changes: { amount: 500000, reason: "Double charge" },
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    ipAddress: "192.168.1.3",
  },
];

const actionIcons: Record<string, React.ReactNode> = {
  PRICE_TIER_CHANGE: <Edit className="w-4 h-4" />,
  USER_BAN: <Ban className="w-4 h-4" />,
  VENUE_VERIFICATION: <CheckCircle className="w-4 h-4" />,
  USER_UNBAN: <CheckCircle className="w-4 h-4" />,
  REVIEW_REJECT: <XCircle className="w-4 h-4" />,
  REFUND_APPROVAL: <Shield className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  PRICE_TIER_CHANGE: "text-amber-400 bg-amber-500/20",
  USER_BAN: "text-red-400 bg-red-500/20",
  VENUE_VERIFICATION: "text-green-400 bg-green-500/20",
  USER_UNBAN: "text-green-400 bg-green-500/20",
  REVIEW_REJECT: "text-red-400 bg-red-500/20",
  REFUND_APPROVAL: "text-blue-400 bg-blue-500/20",
  DELETE: "text-red-400 bg-red-500/20",
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = !search || 
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = !actionFilter || log.action === actionFilter;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = Array.from(new Set(mockLogs.map((l) => l.action)));

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Audit Logs
            </h3>
            <p className="text-white/50 text-sm">Track all admin actions</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-500/40"
          />
        </div>
        
        <select
          value={actionFilter || ""}
          onChange={(e) => setActionFilter(e.target.value || null)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/40"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-white/5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            No audit logs found
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const icon = actionIcons[log.action] || <Edit className="w-4 h-4" />;
            const colorClass = actionColors[log.action] || "text-white/60 bg-white/10";

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                      <span className="text-white/60 text-sm">{log.entityType}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.adminName}
                      </span>
                      <span className="text-white/30">{formatTime(log.timestamp)}</span>
                      <span className="text-white/30">IP: {log.ipAddress}</span>
                    </div>

                    {/* Changes */}
                    {log.changes && (
                      <div className="mt-2 p-2 bg-white/5 rounded-lg text-xs font-mono">
                        {Object.entries(log.changes).map(([key, value]) => (
                          <div key={key} className="text-white/60">
                            <span className="text-amber-400">{key}</span>: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
