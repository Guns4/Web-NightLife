/**
 * =====================================================
 * SMART NOTIFICATIONS SERVICE
 * AfterHoursID - AI-Powered Predictive Scheduling
 * =====================================================
 */

import { predictBestNotificationTime, getSimilarVenues, getUserPreferences } from './recommendation-engine';

// Types
export interface NotificationPayload {
  userId: string;
  type: 'recommendation' | 'reminder' | 'similar_venue' | 'trending' | 'booking_confirmation';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
}

export interface BookingStatus {
  venueId: string;
  venueName: string;
  bookingTime: Date;
  available: boolean;
  isFullyBooked?: boolean;
}

/**
 * Predict optimal notification time based on user behavior
 */
export async function getOptimalNotificationTime(userId: string): Promise<Date> {
  const { dayOfWeek, hour } = await predictBestNotificationTime(userId);
  
  const now = new Date();
  const optimal = new Date(now);
  
  // Set to the target day and hour
  const currentDay = now.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  optimal.setDate(optimal.getDate() + daysUntilTarget);
  optimal.setHours(hour, 0, 0, 0);
  
  // If the time has passed this week, schedule for next week
  if (optimal < now) {
    optimal.setDate(optimal.getDate() + 7);
  }
  
  return optimal;
}

/**
 * Generate similar venue notification when user's usual spot is fully booked
 */
export async function generateSimilarVenueNotification(
  userId: string,
  originalVenue: { id: string; name: string; city: string },
  bookingStatus: BookingStatus
): Promise<NotificationPayload | null> {
  if (bookingStatus.available) {
    return null; // Venue is available, no need for alternative
  }
  
  // Get similar venues
  const similar = await getSimilarVenues(originalVenue.id, 3);
  
  if (similar.length === 0) {
    return null;
  }
  
  const topSimilar = similar[0];
  
  return {
    userId,
    type: 'similar_venue',
    title: `${originalVenue.name} is fully booked!`,
    body: `No worries! We found a similar venue "${topSimilar.name}" nearby that's still open.`,
    data: {
      originalVenue: {
        id: originalVenue.id,
        name: originalVenue.name,
      },
      alternativeVenue: {
        id: topSimilar.id,
        name: topSimilar.name,
        category: topSimilar.category,
        rating: topSimilar.rating,
      },
      reason: 'fully_booked_alternative',
    },
  };
}

/**
 * Generate personalized recommendation notification
 */
export async function generateRecommendationNotification(
  userId: string,
  location?: string
): Promise<NotificationPayload> {
  const preferences = await getUserPreferences(userId);
  
  // Get top preferred category
  const topCategory = Object.entries(preferences.categories)
    .sort(([, a], [, b]) => b - a)[0];
  
  const categoryName = topCategory?.[0] || 'trending venues';
  
  return {
    userId,
    type: 'recommendation',
    title: `Check out this ${categoryName}!`,
    body: `We found some amazing ${categoryName} near you that match your style.`,
    data: {
      category: categoryName,
      location,
    },
  };
}

/**
 * Generate trending venue notification
 */
export async function generateTrendingNotification(
  userId: string,
  city: string
): Promise<NotificationPayload> {
  return {
    userId,
    type: 'trending',
    title: '🔥 Hot right now!',
    body: `The hottest venues in ${city} are trending tonight. Don't miss out!`,
    data: {
      city,
      trendType: 'checkin_spike',
    },
  };
}

/**
 * Generate booking reminder notification
 */
export async function generateBookingReminder(
  userId: string,
  venueName: string,
  bookingTime: Date
): Promise<NotificationPayload> {
  const hoursUntil = Math.round((bookingTime.getTime() - Date.now()) / (1000 * 60 * 60));
  
  return {
    userId,
    type: 'reminder',
    title: `📅 Reminder: ${venueName}`,
    body: hoursUntil > 0 
      ? `Your reservation at ${venueName} is in ${hoursUntil} hours!`
      : `Your reservation at ${venueName} is happening now!`,
    data: {
      venueName,
      bookingTime: bookingTime.toISOString(),
    },
  };
}

/**
 * Batch process notifications for multiple users
 */
export async function batchProcessNotifications(
  users: string[],
  notificationGenerator: (userId: string) => Promise<NotificationPayload>
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];
  
  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(notificationGenerator)
    );
    notifications.push(...results.filter(Boolean) as NotificationPayload[]);
  }
  
  return notifications;
}

/**
 * Check if notification should be sent based on user preferences
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: string
): Promise<boolean> {
  // In production, check user's notification preferences
  // For now, allow all
  return true;
}

/**
 * Get notification priority based on type
 */
export function getNotificationPriority(type: NotificationPayload['type']): number {
  const priorities: Record<NotificationPayload['type'], number> = {
    booking_confirmation: 1,
    reminder: 2,
    similar_venue: 3,
    recommendation: 4,
    trending: 5,
  };
  
  return priorities[type] || 5;
}
