/**
 * =====================================================
 * ROI DASHBOARD SERVICE
 * AfterHoursID - Real-Time ROI Dashboard
 * =====================================================
 */

import { formatCurrency, currencies } from './i18n-service';

// =====================================================
// TYPES
// =====================================================

export interface ROIData {
  timestamp: string;
  revenue: number;
  adSpend: number;
  userAcquisition: number;
  conversionRate: number;
  roi: number;
}

export interface PaymentData {
  orderId: string;
  grossAmount: number;
  currency: string;
  settlementStatus: 'pending' | 'settlement' | 'capture' | 'deny' | 'expire' | 'cancel';
  paymentType: string;
  transactionTime: string;
}

export interface VenueMetrics {
  venueId: string;
  venueName: string;
  bookings: number;
  revenue: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardSummary {
  totalRevenue: number;
  totalAdSpend: number;
  totalUsers: number;
  overallROI: number;
  topVenues: VenueMetrics[];
  recentTransactions: PaymentData[];
  lastUpdated: string;
}

// =====================================================
// METRICS SERVICE
// =====================================================

// In-memory metrics store
let metricsCache: {
  userRegistrations: number;
  bookingClicks: number;
  activeSessions: number;
  lastUpdated: number;
} = {
  userRegistrations: 0,
  bookingClicks: 0,
  activeSessions: 0,
  lastUpdated: Date.now(),
};

/**
 * Record a user registration (called from auth service)
 */
export function recordUserRegistration(): void {
  metricsCache.userRegistrations++;
  metricsCache.lastUpdated = Date.now();
}

/**
 * Record a booking click
 */
export function recordBookingClick(): void {
  metricsCache.bookingClicks++;
  metricsCache.lastUpdated = Date.now();
}

/**
 * Update active sessions
 */
export function updateActiveSessions(count: number): void {
  metricsCache.activeSessions = count;
  metricsCache.lastUpdated = Date.now();
}

/**
 * Get current metrics
 */
export function getPrometheusMetrics() {
  return {
    user_registration_total: metricsCache.userRegistrations,
    booking_click_total: metricsCache.bookingClicks,
    active_session_count: metricsCache.activeSessions,
  };
}

// =====================================================
// MIDTRANS INTEGRATION
// =====================================================

/**
 * Handle Midtrans webhook
 */
export async function handleMidtransWebhook(payload: any): Promise<{
  success: boolean;
  payment?: PaymentData;
}> {
  try {
    const payment: PaymentData = {
      orderId: payload.order_id,
      grossAmount: parseFloat(payload.gross_amount),
      currency: payload.currency || 'IDR',
      settlementStatus: payload.transaction_status,
      paymentType: payload.payment_type,
      transactionTime: payload.transaction_time,
    };
    
    // Process payment (update database, trigger notifications)
    console.log('Processing payment:', payment);
    
    return { success: true, payment };
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return { success: false };
  }
}

/**
 * Fetch payment statistics
 */
export async function fetchPaymentStats(startDate: string, endDate: string): Promise<{
  totalRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  paymentTypes: Record<string, number>;
}> {
  // In production, query database
  return {
    totalRevenue: 125000000, // Rp 125M
    transactionCount: 450,
    averageOrderValue: 277778,
    paymentTypes: {
      qris: 180,
      gopay: 120,
      ovo: 90,
      bank_transfer: 60,
    },
  };
}

// =====================================================
// LOKI LOG QUERIES
// =====================================================

/**
 * Query Loki for payment conversion rate
 */
export async function queryPaymentConversionRate(): Promise<number> {
  // In production, query Loki API
  // Simulated: 200 status / total requests
  return 0.082; // 8.2% conversion rate
}

/**
 * Query Loki for API latency
 */
export async function queryAPILatency(): Promise<{
  p50: number;
  p95: number;
  p99: number;
}> {
  // Simulated latency data
  return {
    p50: 45,   // ms
    p95: 120,  // ms
    p99: 250,  // ms
  };
}

// =====================================================
// DASHBOARD AGGREGATION
// =====================================================

/**
 * Get complete dashboard summary
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Fetch all data sources in parallel
  const [metrics, payments, conversion] = await Promise.all([
    Promise.resolve(getPrometheusMetrics()),
    fetchPaymentStats(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    ),
    queryPaymentConversionRate(),
  ]);
  
  // Calculate ROI
  const revenue = payments.totalRevenue;
  const adSpend = 25000000; // Rp 25M
  const roi = ((revenue - adSpend) / adSpend) * 100;
  
  return {
    totalRevenue: revenue,
    totalAdSpend: adSpend,
    totalUsers: metrics.user_registration_total,
    overallROI: roi,
    topVenues: [
      { venueId: '1', venueName: 'Club XYZ', bookings: 120, revenue: 45000000, rating: 4.8, trend: 'up' },
      { venueId: '2', venueName: 'Bar ABC', bookings: 95, revenue: 32000000, rating: 4.5, trend: 'up' },
      { venueId: '3', venueName: 'Lounge 123', bookings: 78, revenue: 28000000, rating: 4.3, trend: 'stable' },
    ],
    recentTransactions: [
      { orderId: 'ORD-001', grossAmount: 500000, currency: 'IDR', settlementStatus: 'settlement', paymentType: 'qris', transactionTime: new Date().toISOString() },
      { orderId: 'ORD-002', grossAmount: 750000, currency: 'IDR', settlementStatus: 'settlement', paymentType: 'gopay', transactionTime: new Date().toISOString() },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get ROI time series data
 */
export async function getROITimeSeries(days: number = 7): Promise<ROIData[]> {
  const data: ROIData[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const revenue = 15000000 + Math.random() * 10000000;
    const adSpend = 3000000 + Math.random() * 2000000;
    const users = 50 + Math.floor(Math.random() * 100);
    const conversion = 0.06 + Math.random() * 0.04;
    
    data.push({
      timestamp: date.toISOString(),
      revenue,
      adSpend,
      userAcquisition: users,
      conversionRate: conversion,
      roi: ((revenue - adSpend) / adSpend) * 100,
    });
  }
  
  return data;
}

/**
 * Get geospatial booking data for heatmap
 */
export async function getBookingHeatmap(): Promise<{
  lat: number;
  lng: number;
  weight: number;
  city: string;
}[]> {
  // Simulated geospatial data
  return [
    { lat: -6.1751, lng: 106.8650, weight: 100, city: 'Jakarta' },
    { lat: -6.2088, lng: 106.8456, weight: 85, city: 'Jakarta' },
    { lat: -8.3405, lng: 115.0920, weight: 60, city: 'Bali' },
    { lat: -7.2575, lng: 112.7521, weight: 45, city: 'Surabaya' },
    { lat: -6.9175, lng: 107.6191, weight: 35, city: 'Bandung' },
    { lat: -7.7956, lng: 110.3695, weight: 25, city: 'Yogyakarta' },
  ];
}
