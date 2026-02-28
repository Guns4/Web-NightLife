/**
 * =====================================================
 * NOTIFICATION BELL
 * Glowing badge with unread count
 * =====================================================
 */

"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export default function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-white/10 rounded-xl transition-colors group"
    >
      {/* Glow effect when unread */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 bg-amber-500/20 rounded-xl blur-md"
        />
      )}
      
      <div className="relative">
        <Bell className="w-6 h-6 text-white group-hover:text-amber-400 transition-colors" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center"
          >
            {/* Pulsing red dot */}
            <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <span className="relative flex items-center justify-center w-full h-full bg-red-500 rounded-full">
              <span className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          </motion.div>
        )}
      </div>
    </button>
  );
}
