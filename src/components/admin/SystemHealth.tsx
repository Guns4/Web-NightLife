/**
 * =====================================================
 * SYSTEM HEALTH DASHBOARD
 * Real-time service status and latency monitoring
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Database,
  Server,
  Zap,
  Globe,
  RefreshCw
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  uptime: number;
  lastCheck: string;
  icon: React.ReactNode;
}

const initialServices: ServiceStatus[] = [
  { 
    name: "API Gateway", 
    status: "healthy", 
    latency: 45, 
    uptime: 99.9, 
    lastCheck: new Date().toISOString(),
    icon: <Globe className="w-5 h-5" />
  },
  { 
    name: "PostgreSQL", 
    status: "healthy", 
    latency: 12, 
    uptime: 99.99, 
    lastCheck: new Date().toISOString(),
    icon: <Database className="w-5 h-5" />
  },
  { 
    name: "MongoDB", 
    status: "healthy", 
    latency: 28, 
    uptime: 99.5, 
    lastCheck: new Date().toISOString(),
    icon: <Database className="w-5 h-5" />
  },
  { 
    name: "Socket.io", 
    status: "healthy", 
    latency: 5, 
    uptime: 99.8, 
    lastCheck: new Date().toISOString(),
    icon: <Zap className="w-5 h-5" />
  },
  { 
    name: "Redis Cache", 
    status: "healthy", 
    latency: 2, 
    uptime: 99.95, 
    lastCheck: new Date().toISOString(),
    icon: <Server className="w-5 h-5" />
  },
  { 
    name: "Auth Service", 
    status: "healthy", 
    latency: 35, 
    uptime: 99.7, 
    lastCheck: new Date().toISOString(),
    icon: <Activity className="w-5 h-5" />
  },
];

const statusColors = {
  healthy: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  degraded: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  down: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: <XCircle className="w-4 h-4" />,
  },
};

export default function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overallHealth, setOverallHealth] = useState(99.5);

  // Simulate periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random latency fluctuations
      setServices((prev) =>
        prev.map((service) => ({
          ...service,
          latency: Math.max(1, service.latency + Math.floor(Math.random() * 10) - 5),
          lastCheck: new Date().toISOString(),
        }))
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Calculate overall health
  useEffect(() => {
    const healthyCount = services.filter((s) => s.status === "healthy").length;
    const health = (healthyCount / services.length) * 100;
    setOverallHealth(health);
  }, [services]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            System Health
          </h3>
          <p className="text-white/50 text-sm">Real-time service monitoring</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Overall Health */}
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{overallHealth.toFixed(1)}%</p>
            <p className="text-white/50 text-xs">Overall Uptime</p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white/60 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => {
          const colors = statusColors[service.status];
          
          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={colors.text}>{service.icon}</div>
                  <span className="text-white font-medium">{service.name}</span>
                </div>
                <span className={`flex items-center gap-1 ${colors.text} text-xs`}>
                  {colors.icon}
                  {service.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-white/40 text-xs">Latency</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.latency}ms
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Uptime</p>
                  <p className="text-white font-medium">{service.uptime}%</p>
                </div>
              </div>
              
              <p className="text-white/30 text-xs mt-3">
                Last check: {new Date(service.lastCheck).toLocaleTimeString()}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Latency Chart (Simple) */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <h4 className="text-white/80 text-sm font-medium mb-4">Response Time Trend</h4>
        <div className="flex items-end gap-1 h-20">
          {[65, 45, 32, 78, 55, 42, 38, 52, 48, 35, 28, 45].map((latency, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-amber-500/30 to-amber-500/10 rounded-t"
              style={{ height: `${(latency / 100) * 100}%` }}
              title={`${latency}ms`}
            />
          ))}
        </div>
        <div className="flex justify-between text-white/30 text-xs mt-2">
          <span>1h ago</span>
          <span>30m ago</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
