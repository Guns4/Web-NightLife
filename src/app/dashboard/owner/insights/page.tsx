"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Phone, Calendar, MousePointerClick, BarChart3,
  Target, Zap, Filter
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// Mock data for demonstration
const revenueData = [
  { date: "Jan", whatsapp: 45000000, table: 78000000, walkin: 32000000 },
  { date: "Feb", whatsapp: 52000000, table: 82000000, walkin: 38000000 },
  { date: "Mar", whatsapp: 61000000, table: 95000000, walkin: 45000000 },
  { date: "Apr", whatsapp: 58000000, table: 88000000, walkin: 41000000 },
  { date: "May", whatsapp: 72000000, table: 110000000, walkin: 52000000 },
  { date: "Jun", whatsapp: 85000000, table: 125000000, walkin: 61000000 },
];

const peakHourData = [
  { hour: "18:00", searches: 120, conversions: 45 },
  { hour: "19:00", searches: 280, conversions: 95 },
  { hour: "20:00", searches: 450, conversions: 180 },
  { hour: "21:00", searches: 680, conversions: 290 },
  { hour: "22:00", searches: 890, conversions: 420 },
  { hour: "23:00", searches: 1020, conversions: 510 },
  { hour: "00:00", searches: 780, conversions: 380 },
  { hour: "01:00", searches: 420, conversions: 180 },
];

const competitorData = [
  { name: "Your Venue", score: 87, color: "#C026D3" },
  { name: "Club X", score: 72, color: "#9333EA" },
  { name: "Venue Y", score: 65, color: "#6366F1" },
  { name: "Bar Z", score: 58, color: "#8B5CF6" },
];

const sourceDistribution = [
  { name: "WhatsApp", value: 35, color: "#25D366" },
  { name: "Table Booking", value: 45, color: "#C026D3" },
  { name: "Walk-in", value: 20, color: "#9333EA" },
];

const dailyRevenue = [
  { day: "Mon", revenue: 15000000 },
  { day: "Tue", revenue: 18000000 },
  { day: "Wed", revenue: 22000000 },
  { day: "Thu", revenue: 25000000 },
  { day: "Fri", revenue: 38000000 },
  { day: "Sat", revenue: 45000000 },
  { day: "Sun", revenue: 32000000 },
];

/**
 * Insights Dashboard - Revenue & Analytics Engine
 */
export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.whatsapp + d.table + d.walkin, 0);
  const totalWhatsapp = revenueData.reduce((sum, d) => sum + d.whatsapp, 0);
  const totalTable = revenueData.reduce((sum, d) => sum + d.table, 0);
  const conversionRate = 32.5;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">Insights Dashboard</h1>
          <p className="text-white/60">Revenue attribution & performance analytics</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? "bg-[#C026D3] text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Total Revenue", 
            value: `Rp ${(totalRevenue / 1000000).toFixed(0)}M`, 
            change: "+18.5%", 
            icon: DollarSign, 
            color: "text-green-400",
            trend: "up"
          },
          { 
            title: "WhatsApp Leads", 
            value: `Rp ${(totalWhatsapp / 1000000).toFixed(0)}M`, 
            change: "+24%", 
            icon: Phone, 
            color: "text-green-400",
            trend: "up"
          },
          { 
            title: "Table Bookings", 
            value: `Rp ${(totalTable / 1000000).toFixed(0)}M`, 
            change: "+32%", 
            icon: Calendar, 
            color: "text-[#C026D3]",
            trend: "up"
          },
          { 
            title: "Conversion Rate", 
            value: `${conversionRate}%`, 
            change: "+4.2%", 
            icon: Target, 
            color: "text-blue-400",
            trend: "up"
          },
        ].map((kpi, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              <div className={`flex items-center gap-1 text-sm font-medium ${kpi.color}`}>
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {kpi.change}
              </div>
            </div>
            <p className="text-white/60 text-sm">{kpi.title}</p>
            <p className="text-2xl font-bold text-white font-inter">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Attribution Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white">Revenue Attribution</h3>
            <p className="text-sm text-white/50">Track revenue by source</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#25D366]" />
              WhatsApp Leads
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C026D3]" />
              Table Booking
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#9333EA]" />
              Walk-in
            </span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTable" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C026D3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C026D3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWalkin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                formatter={(value) => [`Rp ${((Number(value) || 0)/1000000).toFixed(1)}M`, ""]}
              />
              <Area type="monotone" dataKey="whatsapp" stroke="#25D366" strokeWidth={2} fillOpacity={1} fill="url(#colorWhatsapp)" stackId="1" />
              <Area type="monotone" dataKey="table" stroke="#C026D3" strokeWidth={2} fillOpacity={1} fill="url(#colorTable)" stackId="1" />
              <Area type="monotone" dataKey="walkin" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#colorWalkin)" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hour Prediction */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Peak Hour Prediction</h3>
              <p className="text-sm text-white/50">Best times to post promos</p>
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="searches" fill="#C026D3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-sm text-yellow-400">
              📊 <strong>Insight:</strong> Peak search time is 22:00-23:00. Post your promos at 19:00 for maximum reach!
            </p>
          </div>
        </motion.div>

        {/* Revenue by Source */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Revenue Distribution</h3>
              <p className="text-sm text-white/50">By booking source</p>
            </div>
            <MousePointerClick className="w-5 h-5 text-[#C026D3]" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {sourceDistribution.map((source) => (
              <div key={source.name} className="text-center">
                <div className="text-xl font-bold text-white">{source.value}%</div>
                <div className="text-xs text-white/50">{source.name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Competitor Benchmarking */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.7 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white">Competitor Benchmarking</h3>
            <p className="text-sm text-white/50">Vibe Score comparison</p>
          </div>
          <BarChart3 className="w-5 h-5 text-[#9333EA]" />
        </div>
        <div className="space-y-4">
          {competitorData.map((comp, index) => (
            <div key={comp.name} className="flex items-center gap-4">
              <div className="w-24 text-sm text-white/70">{comp.name}</div>
              <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${comp.score}%` }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  className={`h-full rounded-full ${index === 0 ? "bg-gradient-to-r from-[#C026D3] to-[#9333EA]" : "bg-white/20"}`}
                />
              </div>
              <div className="w-12 text-right">
                <span className={`text-sm font-bold ${index === 0 ? "text-[#C026D3]" : "text-white/60"}`}>
                  {comp.score}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-[#C026D3]/10 border border-[#C026D3]/20 rounded-xl">
          <p className="text-sm text-[#C026D3]">
            🎯 Your venue is <strong>#1</strong> in the area! Keep maintaining the high vibe score.
          </p>
        </div>
      </motion.div>

      {/* Daily Revenue Pattern */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.8 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
      >
        <h3 className="font-semibold text-white mb-6">Weekly Revenue Pattern</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                formatter={(value) => [`Rp ${(Number(value)/1000000).toFixed(1)}M`, "Revenue"]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#C026D3" 
                strokeWidth={3}
                dot={{ fill: "#C026D3", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: "#C026D3" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
