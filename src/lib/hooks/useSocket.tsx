"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
// @ts-expect-error - socket.io-client v4 has type issues with default export
import { io } from "socket.io-client";
import { useAuthStore } from "@/lib/auth/store";

// Define Socket type manually to avoid type issues
type SocketInstance = {
  connect(): void;
  disconnect(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
};

interface SocketContextValue {
  socket: SocketInstance | null;
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
  const [socket, setSocket] = useState<SocketInstance | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      socket?.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ah_access_token="))
      ?.split("=")[1];

    if (!accessToken) return;

    const newSocket = io(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      {
        path: "/api/socketio",
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
    });

    newSocket.on("notification:new", (notification: NotificationItem) => {
      setNotifications((prev: NotificationItem[]) => [
        { ...notification, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    });

    newSocket.on("notification:read:confirmed", (notificationId: string) => {
      setNotifications((prev: NotificationItem[]) =>
        prev.map((n: NotificationItem) =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (socket && isConnected && user?.city) {
      socket.emit("join:city", user.city);
    }
  }, [socket, isConnected, user?.city]);

  useEffect(() => {
    if (
      socket &&
      isConnected &&
      (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")
    ) {
      socket.emit("join:admin");
    }
  }, [socket, isConnected, user?.role]);

  const unreadCount = notifications.filter((n: NotificationItem) => !n.readAt).length;

  const markAsRead = (id: string) => {
    setNotifications((prev: NotificationItem[]) =>
      prev.map((n: NotificationItem) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    socket?.emit("notification:read", id);
  };

  const markAllAsRead = () => {
    setNotifications((prev: NotificationItem[]) =>
      prev.map((n: NotificationItem) => ({ ...n, readAt: new Date().toISOString() }))
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
