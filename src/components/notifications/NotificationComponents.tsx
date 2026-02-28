/**
 * =====================================================
 * NOTIFICATION TOAST
 * Real-time neon-styled popup notification
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ExternalLink, Sparkles, MessageSquare, Calendar, AlertTriangle } from "lucide-react";

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority?: string;
  };
  onDismiss: (id: string) => void;
  duration?: number;
}

const typeIcons = {
  PROMO: Sparkles,
  REVIEW: MessageSquare,
  BOOKING: Calendar,
  SYSTEM: AlertTriangle,
  VVIP: Sparkles,
};

const typeColors = {
  PROMO: "from-purple-500 to-pink-500",
  REVIEW: "from-blue-500 to-cyan-500",
  BOOKING: "from-green-500 to-emerald-500",
  SYSTEM: "from-amber-500 to-orange-500",
  VVIP: "from-amber-500 to-red-500",
};

export function NotificationToast({
  notification,
  onDismiss,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
  const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.SYSTEM;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, duration, onDismiss]);

  const handleClick = () => {
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
        >
          <div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl"
            onClick={handleClick}
          >
            {/* Gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10`} />
            
            {/* Content */}
            <div className="relative p-4 flex items-start gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm truncate">
                  {notification.title}
                </h4>
                <p className="text-white/60 text-xs mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
                {notification.link && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs mt-2">
                    <ExternalLink className="w-3 h-3" />
                    <span>Tap to view</span>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  setTimeout(() => onDismiss(notification.id), 300);
                }}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-white/10">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`h-full bg-gradient-to-r ${colorClass}`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Toast container - manages multiple toasts
 */
interface ToastContainerProps {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority?: string;
  }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ notifications, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
