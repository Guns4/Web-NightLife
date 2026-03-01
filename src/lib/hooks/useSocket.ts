/**
 * =====================================================
 * SOCKET.IO CLIENT HOOK
 * Real-time notification consumer
 * =====================================================
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore, type AuthUser } from "@/lib/auth/store";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: string;
  createdAt: string;
  readAt?: string;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user, isAuthenticated } = useAuthStore();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get access token from cookie or state
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ah_access_token="))
      ?.split("=")[1];

    if (!accessToken) return;

    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", {
      path: "/api/socketio",
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Listen for new notifications
    newSocket.on("notification:new", (notification: NotificationItem) => {
      console.log("New notification received:", notification);
      
      // Add to notifications list
      setNotifications((prev) => [{
        ...notification,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    });

    // Listen for read confirmation
    newSocket.on("notification:read:confirmed", (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Join city room when user city is known
  useEffect(() => {
    if (socket && isConnected && user?.city) {
      socket.emit("join:city", user.city);
    }
  }, [socket, isConnected, user?.city]);

  // Join admin room if admin
  useEffect(() => {
    if (socket && isConnected && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")) {
      socket.emit("join:admin");
    }
  }, [socket, isConnected, user?.role]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    socket?.emit("notification:read", id);
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
