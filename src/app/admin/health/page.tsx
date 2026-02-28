'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, Database, Cloud, Clock, TrendingUp, TrendingDown, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: 'Server Latency',
      value: 145,
      unit: 'ms',
      status: 'good',
      trend: 'down',
      history: [180, 165, 155, 148, 145]
    },
    {
      name: 'Database Load',
      value: 42,
      unit: '%',
      status: 'good',
      trend: 'stable',
      history: [40, 42, 41, 43, 42]
    },
    {
      name: 'API Requests',
      value: 1250,
      unit: '/min',
      status: 'good',
      trend: 'up',
      history: [980, 1050, 1120, 1180, 1250]
    },
    {
      name: 'Error Rate',
      value: 0.3,
      unit: '%',
      status: 'good',
      trend: 'down',
      history: [0.8, 0.6, 0.5, 0.4, 0.3]
    }
  ]);

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Supabase (Database)', status: 'operational', latency: 45, lastChecked: new Date().toISOString() },
    { name: 'Supabase (Auth)', status: 'operational', latency: 38, lastChecked: new Date().toISOString() },
    { name: 'Cloudinary (Media)', status: 'operational', latency: 120, lastChecked: new Date().toISOString() },
    { name: 'OpenAI (Vision AI)', status: 'operational', latency: 850, lastChecked: new Date().toISOString() },
    { name: 'WhatsApp API', status: 'degraded', latency: 320, lastChecked: new Date().toISOString() },
    { name: 'Vercel (Edge)', status: 'operational', latency: 65, lastChecked: new Date().toISOString() },
  ]);

  const [cloudinaryUsage, setCloudinaryUsage] = useState({
    used: 2.4,
    limit: 10,
    unit: 'GB',
    bandwidth: {
      used: 8.2,
      limit: 20,
      unit: 'GB'
    }
  });

  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.name === 'Server Latency' 
          ? Math.max(80, m.value + Math.floor(Math.random() * 20) - 10)
          : m.name === 'Database Load'
          ? Math.max(20, Math.min(80, m.value + Math.floor(Math.random() * 10) - 5))
          : m.name === 'API Requests'
          ? Math.floor(m.value * (0.95 + Math.random() * 0.1))
          : Math.max(0, m.value + (Math.random() * 0.2 - 0.1)),
        history: [...m.history.slice(1), m.value]
      })));
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical' | 'operational' | 'degraded' | 'down') => {
    if (status === 'good' || status === 'operational') return 'text-green-500';
    if (status === 'warning' || status === 'degraded') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBg = (status: 'good' | 'warning' | 'critical' | 'operational' | 'degraded' | 'down') => {
    if (status === 'good' || status === 'operational') return 'bg-green-500/20 border-green-500/30';
    if (status === 'warning' || status === 'degraded') return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-yellow-500" />
            System Health
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time monitoring of Nightlife.ID infrastructure
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div 
            key={metric.name}
            className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{metric.name}</span>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                {metric.value.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm">{metric.unit}</span>
            </div>
            {/* Mini sparkline */}
            <div className="flex items-end gap-1 mt-3 h-8">
              {metric.history.map((val, i) => {
                const max = Math.max(...metric.history);
                const height = (val / max) * 100;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${getStatusBg(metric.status).split(' ')[0]}`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Status */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-yellow-500" />
            Service Status
          </h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div 
                key={service.name}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {service.status === 'operational' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : service.status === 'degraded' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {service.latency && (
                    <span className="text-sm text-gray-400">
                      {service.latency}ms
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusBg(service.status)}`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cloudinary Usage */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-yellow-500" />
            Cloudinary Storage
          </h2>
          
          {/* Storage */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Storage Used</span>
              <span className="text-sm">
                <span className="text-white font-medium">{cloudinaryUsage.used}</span>
                <span className="text-gray-500"> / {cloudinaryUsage.limit} {cloudinaryUsage.unit}</span>
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(cloudinaryUsage.used / cloudinaryUsage.limit) * 100}%` }}
              />
            </div>
          </div>

          {/* Bandwidth */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Bandwidth</span>
              <span className="text-sm">
                <span className="text-white font-medium">{cloudinaryUsage.bandwidth.used}</span>
                <span className="text-gray-500"> / {cloudinaryUsage.bandwidth.limit} {cloudinaryUsage.bandwidth.unit}</span>
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${(cloudinaryUsage.bandwidth.used / cloudinaryUsage.bandwidth.limit) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">12.4K</div>
              <div className="text-xs text-gray-400">Images</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">2.1K</div>
              <div className="text-xs text-gray-400">Videos</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">847</div>
              <div className="text-xs text-gray-400">Transforms</div>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-500" />
            Database Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Venues</div>
              <div className="text-2xl font-bold text-white">2,847</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Active Users</div>
              <div className="text-2xl font-bold text-white">15.2K</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Reviews Today</div>
              <div className="text-2xl font-bold text-white">342</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Avg Response</div>
              <div className="text-2xl font-bold text-white">45ms</div>
            </div>
          </div>
        </div>

        {/* System Uptime */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            System Uptime
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Last 24 Hours</span>
              <span className="text-green-500 font-medium">99.98%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Last 7 Days</span>
              <span className="text-green-500 font-medium">99.95%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Last 30 Days</span>
              <span className="text-green-500 font-medium">99.92%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Deployments</span>
              <span className="text-white font-medium">127</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
