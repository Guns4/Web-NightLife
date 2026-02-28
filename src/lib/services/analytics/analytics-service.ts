/**
 * =====================================================
 * ANALYTICS SERVICE
 * Aggregates data from PostgreSQL, MongoDB, and Redis
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";
import { getMongoDB } from "@/lib/services/promo/mongo-promo-service";
import { getIO } from "@/lib/services/notifications/socket-service";

// =====================================================
// TYPES
// =====================================================

export interface DashboardMetrics {
  totalGMV: number;
  activeUsers: number;
  activeUsersTrend: number; // % change
  totalVenues: number;
  totalPromos: number;
  adConversionRate: number;
  pendingModeration: number;
  totalReviews: number;
}

export interface RevenueByCity {
  city: string;
  revenue: number;
  venues: number;
  users: number;
}

export interface UserTrend {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface AdPerformance {
  promoId: string;
  title: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

// =====================================================
// DASHBOARD METRICS
// =====================================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // PostgreSQL queries
  const [
    totalUsers,
    totalVenues,
    totalReviews,
    pendingModeration,
    recentUsers,
    lastMonthUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.venue.count(),
    prisma.vibeCheck.count(),
    prisma.vibeCheck.count({ where: { isApproved: false } }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // MongoDB promos
  let totalPromos = 0;
  try {
    const mongo = await getMongoDB();
    if (mongo) {
      totalPromos = await mongo.collection("promos").countDocuments({
        isActive: true,
        endDate: { $gte: new Date() },
      });
    }
  } catch (error) {
    console.error("MongoDB promo count error:", error);
  }

  // Redis - active socket connections
  let activeConnections = 0;
  try {
    const io = getIO();
    if (io) {
      activeConnections = io.sockets.sockets.size;
    }
  } catch (error) {
    console.error("Redis connection count error:", error);
  }

  // Calculate trends
  const userTrend = lastMonthUsers > 0 
    ? ((recentUsers - lastMonthUsers) / lastMonthUsers) * 100 
    : 100;

  // Placeholder GMV (would need transactions table)
  const totalGMV = 0; // Would calculate from transactions

  // Placeholder ad conversion rate
  const adConversionRate = 3.5; // Would calculate from ads

  return {
    totalGMV,
    activeUsers: recentUsers,
    activeUsersTrend: userTrend,
    totalVenues,
    totalPromos,
    adConversionRate,
    pendingModeration,
    totalReviews,
  };
}

// =====================================================
// REVENUE BY CITY
// =====================================================

/**
 * Get revenue breakdown by city
 */
export async function getRevenueByCity(): Promise<RevenueByCity[]> {
  const venues = await prisma.venue.groupBy({
    by: ["city"],
    _count: { id: true },
    where: {
      city: { not: null },
      isActive: true,
    },
  });

  // Get user counts per city
  const users = await prisma.user.groupBy({
    by: ["city"],
    _count: { id: true },
    where: {
      city: { not: null },
    },
  });

  const userMap = new Map(users.map(u => [u.city, u._count.id]));
  
  return venues.map((v) => ({
    city: v.city || "Unknown",
    revenue: 0, // Would calculate from transactions
    venues: v._count.id,
    users: userMap.get(v.city || "") || 0,
  }));
}

// =====================================================
// USER TRENDS
// =====================================================

/**
 * Get user registration trends (last 30 days)
 */
export async function getUserTrends(): Promise<UserTrend[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<string, { newUsers: number; activeUsers: number }>();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    dateMap.set(date, { newUsers: 0, activeUsers: 0 });
  }

  users.forEach((u) => {
    const date = u.createdAt.toISOString().split("T")[0];
    const entry = dateMap.get(date);
    if (entry) {
      entry.newUsers += 1;
      entry.activeUsers += 1;
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      newUsers: data.newUsers,
      activeUsers: data.activeUsers,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// =====================================================
// AD PERFORMANCE
// =====================================================

/**
 * Get ad/promo performance metrics
 */
export async function getAdPerformance(): Promise<AdPerformance[]> {
  try {
    const mongo = await getMongoDB();
    if (!mongo) return [];

    const promos = await mongo
      .collection("promos")
      .find({
        isActive: true,
      })
      .project({
        title: 1,
        impressions: 1,
        clicks: 1,
        conversions: 1,
      })
      .limit(10)
      .toArray();

    return promos.map((p) => ({
      promoId: p._id?.toString() || "",
      title: p.title || "Untitled",
      impressions: p.impressions || 0,
      clicks: p.clicks || 0,
      conversions: p.conversions || 0,
      ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
      conversionRate: p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0,
    }));
  } catch (error) {
    console.error("Ad performance error:", error);
    return [];
  }
}

// =====================================================
// REAL-TIME METRICS
// =====================================================

/**
 * Get real-time active users
 */
export async function getRealTimeMetrics() {
  // Active socket connections
  let activeConnections = 0;
  try {
    const io = getIO();
    if (io) {
      activeConnections = io.sockets.sockets.size;
    }
  } catch (error) {
    console.error("Socket count error:", error);
  }

  // Recent activity (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const [recentBookings, recentReviews, recentSignups] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: oneHourAgo } },
    }),
    prisma.vibeCheck.count({
      where: { createdAt: { gte: oneHourAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: oneHourAgo } },
    }),
  ]);

  return {
    activeConnections,
    recentBookings,
    recentReviews,
    recentSignups,
    lastUpdated: new Date().toISOString(),
  };
}

// =====================================================
// REVENUE METRICS
// =====================================================

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Placeholder - would need actual transactions table
  // For now, calculate from bookings
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startDate },
      status: "confirmed",
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  const dailyRevenue = new Map<string, number>();
  
  bookings.forEach((b) => {
    const date = b.createdAt.toISOString().split("T")[0];
    dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + (b.totalAmount || 0));
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const avgOrderValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  return {
    totalRevenue,
    avgOrderValue,
    totalTransactions: bookings.length,
    dailyRevenue: Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
