"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const reservationData = [
  { time: "18:00", count: 12 },
  { time: "19:00", count: 28 },
  { time: "20:00", count: 45 },
  { time: "21:00", count: 67 },
  { time: "22:00", count: 89 },
  { time: "23:00", count: 102 },
  { time: "00:00", count: 78 },
];

const todayReservations = [
  { id: "1", name: "PT. Digital Nusantara", venue: "VVIP Room", time: "20:00", guests: 15, status: "confirmed" },
  { id: "2", name: "Andreas Pratama", venue: "Private Booth", time: "21:30", guests: 8, status: "pending" },
  { id: "3", name: "Jakarta Entertainment", venue: "Main Hall", time: "22:00", guests: 25, status: "confirmed" },
  { id: "4", name: "Celebration Club", venue: "VIP Table", time: "23:00", guests: 12, status: "seated" },
  { id: "5", name: "Tech StartUp ID", venue: "Rooftop", time: "23:30", guests: 20, status: "pending" },
];

const queueData = [
  { name: "Main Dance Floor", current: 45, max: 150, wait: "0 min" },
  { name: "VIP Lounge", current: 12, max: 30, wait: "5 min" },
  { name: "Rooftop Bar", current: 28, max: 50, wait: "0 min" },
  { name: "Private Rooms", current: 8, max: 12, wait: "15 min" },
];

/**
 * Operations Dashboard Page
 */
export default function OpsDashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">Operations Overview</h1>
        <p className="text-white/60">Real-time reservations and queue management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Reservations", value: "156", change: "+24", icon: Calendar, color: "text-blue-400", up: true },
          { title: "Currently Seated", value: "89", change: "+12", icon: Users, color: "text-green-400", up: true },
          { title: "Queue Wait Time", value: "5 min", change: "-2 min", icon: Clock, color: "text-yellow-400", up: false },
          { title: "Pending Approval", value: "12", change: "+3", icon: AlertCircle, color: "text-[#C026D3]", up: true },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.up ? "text-green-400" : "text-red-400"}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-white/60 text-sm">{stat.title}</p>
            <p className="text-2xl font-bold text-white font-inter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="font-semibold text-white mb-6">Reservations by Hour</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reservationData}>
              <defs>
                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="count" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Reservations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-6">Today's Reservations</h3>
          <div className="space-y-3">
            {todayReservations.map((res) => (
              <div key={res.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{res.name}</p>
                  <p className="text-xs text-white/50">{res.venue} • {res.guests} guests • {res.time}</p>
                </div>
                <StatusBadge status={res.status} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Queue Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-6">Queue & Capacity</h3>
          <div className="space-y-4">
            {queueData.map((queue, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{queue.name}</span>
                  <span className="text-xs text-white/60">{queue.current}/{queue.max} • {queue.wait}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(queue.current / queue.max) * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${queue.current / queue.max > 0.8 ? "bg-red-500" : queue.current / queue.max > 0.5 ? "bg-yellow-500" : "bg-green-500"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    seated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const icons = {
    confirmed: CheckCircle,
    pending: AlertCircle,
    seated: Users,
    cancelled: XCircle,
  };
  const Icon = icons[status as keyof typeof icons] || AlertCircle;
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
