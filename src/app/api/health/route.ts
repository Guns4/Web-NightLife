/**
 * =====================================================
 * HEALTH CHECK API
 * AfterHoursID - Production Reliability
 * =====================================================
 */

import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/lib/services/monitoring-service';

export const dynamic = 'force-dynamic';

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const health = getHealthStatus();
    
    // Determine status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// HEAD /api/health - For load balancer health checks
export async function HEAD() {
  try {
    const health = getHealthStatus();
    
    if (health.status === 'healthy') {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
