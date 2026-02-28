/**
 * =====================================================
 * METRICS API
 * AfterHoursID - Production Reliability
 * =====================================================
 */

import { NextResponse } from 'next/server';
import { getPrometheusMetrics } from '@/lib/services/monitoring-service';

export const dynamic = 'force-dynamic';

// GET /api/metrics - Prometheus metrics endpoint
export async function GET() {
  try {
    const metrics = await getPrometheusMetrics();
    
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
