"use client";

import { motion } from "framer-motion";
import { Percent, Image, TrendingUp, Eye, MousePointerClick, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const promoData = [
  { day: "Mon", clicks: 45, conversions: 12 },
  { day: "Tue", clicks: 67, conversions: 18 },
  { day: "Wed", clicks: 52, conversions: 15 },
  { day: "Thu", clicks: 89, conversions: 24 },
  { day: "Fri", clicks: 145, conversions: 42 },
  { day: "Sat", clicks: 178, conversions: 55 },
  { day: "Sun", clicks: 102, conversions: 28 },
];

const topPromos = [
  { name: "Ladies Night Friday", clicks: 1250, conversions: 320, revenue: "Rp 45.000.000" },
  { name: "Happy Hour Weekday", clicks: 890, conversions: 210, revenue: "Rp 28.000.000" },
  { name: "Weekend Package", clicks: 650, conversions: 180, revenue: "Rp 22.000.000" },
];

/**
 * Marketing Dashboard Page
 */
export default function MarketingDashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">Marketing Overview</h1>
        <p className="text-white/60">Track promo performance and campaigns</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Clicks", value: "12,450", change: "+18%", icon: MousePointerClick, color: "text-blue-400" },
          { title: "Conversions", value: "3,240", change: "+24%", icon: TrendingUp, color: "text-green-400" },
          { title: "Active Promos", value: "8", change: "+2", icon: Percent, color: "text-[#C026D3]" },
          { title: "Boosted", value: "3", change: "Active", icon: Zap, color: "text-yellow-400" },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
            </div>
            <p className="text-white/60 text-sm">{stat.title}</p>
            <p className="text-2xl font-bold text-white font-inter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-6">Click Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={promoData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C026D3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C026D3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="clicks" stroke="#C026D3" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-6">Conversion Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="conversions" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Performing Promos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="font-semibold text-white mb-6">Top Performing Promos</h3>
        <div className="space-y-3">
          {topPromos.map((promo, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C026D3]/20 to-[#9333EA]/20 flex items-center justify-center text-[#C026D3] font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{promo.name}</p>
                <p className="text-xs text-white/50">{promo.clicks} clicks • {promo.conversions} conversions</p>
              </div>
              <div className="text-right">
                <p className="text-[#C026D3] font-semibold">{promo.revenue}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
