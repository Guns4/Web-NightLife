"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Eye, 
  MousePointerClick, 
  MessageCircle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Sparkles,
  Users
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

/**
 * Mock data for demonstration
 */
const analyticsData = [
  { date: "Mon", views: 120, clicks: 45, leads: 12 },
  { date: "Tue", views: 180, clicks: 67, leads: 18 },
  { date: "Wed", views: 150, clicks: 52, leads: 15 },
  { date: "Thu", views: 220, clicks: 89, leads: 24 },
  { date: "Fri", views: 350, clicks: 145, leads: 42 },
  { date: "Sat", views: 420, clicks: 178, leads: 55 },
  { date: "Sun", views: 280, clicks: 102, leads: 28 },
];

const topVenues = [
  { name: "Infinity Club Jakarta", views: 1250, clicks: 420, rating: 4.8 },
  { name: "Neo Soho Lounge", views: 890, clicks: 310, rating: 4.5 },
  { name: "Fazz Pool Club", views: 650, clicks: 220, rating: 4.3 },
];

const recentActivity = [
  { type: "lead", venue: "Infinity Club Jakarta", message: "New booking request from +62 812-3456-7890", time: "2 min ago" },
  { type: "promo", venue: "Neo Soho Lounge", message: "Flash deal activated: 50% off until 11PM", time: "15 min ago" },
  { type: "review", venue: "Fazz Pool Club", message: "New 5-star review from @johndoe", time: "1 hour ago" },
  { type: "view", venue: "Infinity Club Jakarta", message: "100 views today", time: "2 hours ago" },
];

/**
 * Stat Card Component
 */
function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon 
}: {
  title: string;
  value: string | number;
  change: number;
  changeType: "positive" | "negative";
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-[#C026D3]/10">
          <Icon className="w-6 h-6 text-[#C026D3]" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          changeType === "positive" ? "text-green-400" : "text-red-400"
        }`}>
          {changeType === "positive" ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white font-inter">{value}</p>
    </motion.div>
  );
}

/**
 * Owner Dashboard Overview Page
 */
export default function OwnerDashboardPage() {
  const totalViews = analyticsData.reduce((sum, d) => sum + d.views, 0);
  const totalClicks = analyticsData.reduce((sum, d) => sum + d.clicks, 0);
  const totalLeads = analyticsData.reduce((sum, d) => sum + d.leads, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">
            Dashboard Overview
          </h1>
          <p className="text-white/60">Welcome back! Here's your venue performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">Last 7 days</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          change={12}
          changeType="positive"
          icon={Eye}
        />
        <StatCard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          change={8}
          changeType="positive"
          icon={MousePointerClick}
        />
        <StatCard
          title="Booking Leads"
          value={totalLeads.toLocaleString()}
          change={24}
          changeType="positive"
          icon={MessageCircle}
        />
        <StatCard
          title="Conversion Rate"
          value={((totalLeads / totalClicks) * 100).toFixed(1) + "%"}
          change={5}
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="font-semibold text-white mb-6">Visitor Analytics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C026D3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C026D3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#C026D3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Venues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="font-semibold text-white mb-6">Top Performing Venues</h3>
          <div className="space-y-4">
            {topVenues.map((venue, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C026D3]/20 to-[#9333EA]/20 flex items-center justify-center text-[#C026D3] font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{venue.name}</p>
                  <p className="text-xs text-white/50">{venue.views} views</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Sparkles className="w-4 h-4 fill-yellow-400" />
                  <span className="text-sm">{venue.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="font-semibold text-white mb-6">Click Performance</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="clicks" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.type === "lead" ? "bg-green-500/10 text-green-400" :
                  activity.type === "promo" ? "bg-[#C026D3]/10 text-[#C026D3]" :
                  activity.type === "review" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {activity.type === "lead" ? <MessageCircle className="w-4 h-4" /> :
                   activity.type === "promo" ? <Sparkles className="w-4 h-4" /> :
                   activity.type === "review" ? <Users className="w-4 h-4" /> :
                   <Eye className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{activity.venue}</p>
                  <p className="text-xs text-white/60 truncate">{activity.message}</p>
                </div>
                <span className="text-xs text-white/40 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
