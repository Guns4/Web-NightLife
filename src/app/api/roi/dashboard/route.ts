/**
 * =====================================================
 * ROI DASHBOARD API
 * AfterHoursID - Real-Time Dashboard Data
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary, getROITimeSeries, getBookingHeatmap, getPrometheusMetrics } from '@/lib/services/roi-dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    const includeHeatmap = searchParams.get('heatmap') === 'true';
    
    // Parse period
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
    
    // Fetch data in parallel
    const [summary, timeSeries, metrics] = await Promise.all([
      getDashboardSummary(),
      getROITimeSeries(days),
      Promise.resolve(getPrometheusMetrics()),
    ]);
    
    // Optionally include heatmap
    let heatmap = null;
    if (includeHeatmap) {
      heatmap = await getBookingHeatmap();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: summary.totalRevenue,
          totalAdSpend: summary.totalAdSpend,
          totalUsers: summary.totalUsers,
          overallROI: summary.overallROI,
          lastUpdated: summary.lastUpdated,
        },
        metrics: {
          userRegistrations: metrics.user_registration_total,
          bookingClicks: metrics.booking_click_total,
          activeSessions: metrics.active_session_count,
        },
        timeSeries,
        topVenues: summary.topVenues,
        recentTransactions: summary.recentTransactions,
        heatmap,
      },
      meta: {
        period: `${days}d`,
        generatedAt: new Date().toISOString(),
        latency: '< 100ms',
      },
    });
  } catch (error) {
    console.error('ROI Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
