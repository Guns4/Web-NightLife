/**
 * =====================================================
 * SOCKET.IO SERVER SERVICE
 * Real-time notification infrastructure
 * =====================================================
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken, type JWTPayload } from "@/lib/auth/auth-utils";

// Socket.io instance (singleton)
let io: SocketIOServer | null = null;

// Connected users map
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketUsers = new Map<string, string>(); // socketId -> userId

/**
 * Initialize Socket.io server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socketio",
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error("Invalid token"));
      }
      
      // Attach user data to socket
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Token verification failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId} (${socket.id})`);

    // Add socket to user's socket set
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    socketUsers.set(socket.id, userId);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining venue rooms (for merchants)
    socket.on("join:venue", (venueId: string) => {
      socket.join(`venue:${venueId}`);
      console.log(`User ${userId} joined venue room: ${venueId}`);
    });

    // Handle leaving venue rooms
    socket.on("leave:venue", (venueId: string) => {
      socket.leave(`venue:${venueId}`);
      console.log(`User ${userId} left venue room: ${venueId}`);
    });

    // Handle joining city rooms (for city-wide notifications)
    socket.on("join:city", (city: string) => {
      socket.join(`city:${city}`);
      console.log(`User ${userId} joined city room: ${city}`);
    });

    // Handle joining admin room
    socket.on("join:admin", () => {
      const userRole = (socket as any).userRole;
      if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
        socket.join("admin");
        console.log(`Admin ${userId} joined admin room`);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);
      
      // Remove socket from user's socket set
      userSockets.get(userId)?.delete(socket.id);
      socketUsers.delete(socket.id);
      
      // Clean up empty sets
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
      }
    });

    // Handle marking notification as read
    socket.on("notification:read", (notificationId: string) => {
      // Emit to confirm read status
      socket.emit("notification:read:confirmed", notificationId);
    });
  });

  return io;
}

/**
 * Get Socket.io instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

// =====================================================
// NOTIFICATION EMITTERS
// =====================================================

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: string;
}

/**
 * Send notification to a specific user
 */
export function emitNotification(userId: string, notification: NotificationPayload) {
  if (!io) return;

  io.to(`user:${userId}`).emit("notification:new", notification);
}

/**
 * Send notification to all users in a venue (merchant notifications)
 */
export function emitToVenue(venueId: string, event: string, data: any) {
  if (!io) return;

  io.to(`venue:${venueId}`).emit(event, data);
}

/**
 * Broadcast to all users in a city
 */
export function emitToCity(city: string, notification: NotificationPayload) {
  if (!io) return;

  io.to(`city:${city}`).emit("notification:new", notification);
}

/**
 * Broadcast to all admins
 */
export function emitToAdmins(notification: NotificationPayload) {
  if (!io) return;

  io.to("admin").emit("notification:new", notification);
}

/**
 * Broadcast to all connected users
 */
export function broadcast(event: string, data: any) {
  if (!io) return;

  io.emit(event, data);
}

// =====================================================
// EVENT BUS - Internal Event System
// =====================================================

type EventHandler = (data: any) => Promise<void>;

const eventHandlers = new Map<string, EventHandler[]>();

/**
 * Subscribe to an event
 */
export function onEvent(event: string, handler: EventHandler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, []);
  }
  eventHandlers.get(event)!.push(handler);
}

/**
 * Emit an internal event (triggers notification sending)
 */
export async function emitEvent(event: string, data: any) {
  const handlers = eventHandlers.get(event) || [];
  
  for (const handler of handlers) {
    try {
      await handler(data);
    } catch (error) {
      console.error(`Error in event handler for ${event}:`, error);
    }
  }
}

/**
 * Initialize event bus listeners
 */
export function initializeEventBus() {
  // Review Replied Event Handler
  onEvent("review:replied", async (data: { 
    userId: string; 
    venueName: string; 
    reviewComment: string;
    reply: string;
  }) => {
    emitNotification(data.userId, {
      id: `review-${Date.now()}`,
      type: "REVIEW",
      title: "Owner Replied to Your Review",
      message: `${data.venueName} replied: "${data.reply}"`,
      link: `/venue/${encodeURIComponent(data.venueName)}`,
      priority: "MEDIUM",
    });
  });

  // New VVIP Promo Event Handler
  onEvent("promo:vip", async (data: {
    city: string;
    venueName: string;
    promoTitle: string;
    discount: string;
  }) => {
    emitToCity(data.city, {
      id: `promo-${Date.now()}`,
      type: "VVIP",
      title: `🔥 Hot Promo at ${data.venueName}!`,
      message: `${data.promoTitle} - ${data.discount} OFF!`,
      link: `/venue/${encodeURIComponent(data.venueName)}`,
    });
  });

  // Review Flagged Event Handler
  onEvent("review:flagged", async (data: {
    reviewId: string;
    venueName: string;
    reportCount: number;
    reason: string;
  }) => {
    emitToAdmins({
      id: `flagged-${Date.now()}`,
      type: "SYSTEM",
      title: "⚠️ Review Flagged for Immediate Review",
      message: `Review at ${data.venueName} has ${data.reportCount} reports. Reason: ${data.reason}`,
      priority: "HIGH",
    });
  });

  // Booking Confirmed Event Handler
  onEvent("booking:confirmed", async (data: {
    userId: string;
    venueName: string;
    date: string;
    time: string;
    pax: number;
  }) => {
    emitNotification(data.userId, {
      id: `booking-${Date.now()}`,
      type: "BOOKING",
      title: "Booking Confirmed! 🎉",
      message: `Your table at ${data.venueName} for ${data.pax} people on ${data.date} at ${data.time} is confirmed.`,
      link: `/dashboard/bookings`,
      priority: "HIGH",
    });
  });

  console.log("Event bus initialized with handlers");
}
