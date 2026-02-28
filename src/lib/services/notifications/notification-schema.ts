/**
 * =====================================================
 * NOTIFICATION SERVICE - DATABASE SCHEMA
 * Real-time notification infrastructure
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";

// =====================================================
// TYPES
// =====================================================

export type NotificationType = "PROMO" | "REVIEW" | "SYSTEM" | "BOOKING" | "VVIP";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// NOTIFICATION CRUD
// =====================================================

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      priority: input.priority || "MEDIUM",
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata || {},
      isRead: false,
    },
  });

  return notification;
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const where: any = {
    recipientId: userId,
  };

  if (options?.unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { ...where, isRead: false },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + notifications.length < total,
    },
  };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      recipientId: userId, // Ensure user owns this notification
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      recipientId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true, // Only delete read notifications
    },
  });

  return result.count;
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      isRead: false,
    },
  });
}

/**
 * Broadcast notification to multiple users (city-wide or all users)
 */
export async function broadcastNotification(
  userIds: string[],
  input: Omit<CreateNotificationInput, "recipientId">
) {
  const notifications = userIds.map((recipientId) => ({
    recipientId,
    ...input,
  }));

  return prisma.notification.createMany({
    data: notifications,
  });
}
