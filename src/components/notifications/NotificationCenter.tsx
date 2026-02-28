/**
 * =====================================================
 * NOTIFICATION CENTER
 * Glassmorphism slide-over panel
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  ExternalLink, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  AlertTriangle,
  Loader2,
  Trash2
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const typeIcons = {
  PROMO: Sparkles,
  REVIEW: MessageSquare,
  BOOKING: Calendar,
  SYSTEM: AlertTriangle,
  VVIP: Sparkles,
};

const typeColors = {
  PROMO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  REVIEW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BOOKING: "bg-green-500/20 text-green-400 border-green-500/30",
  SYSTEM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  VVIP: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  isLoading = false,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-white font-semibold">Notifications</h2>
                  <p className="text-white/50 text-xs">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/10">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  filter === "unread"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                }`}
              >
                Unread
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="py-2 px-3 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Bell className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/60">
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
                    const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.SYSTEM;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                          !notification.isRead ? "bg-amber-500/5" : ""
                        }`}
                        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.isRead ? "text-white" : "text-white/70"
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="text-white/40 text-xs flex-shrink-0">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-white/50 text-sm mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                              {notification.link && (
                                <a
                                  href={notification.link}
                                  className="flex items-center gap-1 text-amber-400 text-xs hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(notification.id);
                                }}
                                className="flex items-center gap-1 text-white/40 text-xs hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                              {!notification.isRead && (
                                <span className="flex items-center gap-1 text-amber-400 text-xs">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                                  New
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-amber-400 rounded-full" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
