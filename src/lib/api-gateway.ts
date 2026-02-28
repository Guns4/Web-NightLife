/**
 * API Gateway - Middleware-based routing
 * Features: Request validation, Rate limiting, Header transformation
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
interface RouteConfig {
  path: string;
  method?: string;
  rateLimit: number;
  auth: boolean;
  roles?: string[];
}

interface ServiceConfig {
  name: string;
  baseUrl: string;
  routes: RouteConfig[];
}

// Service configurations
const SERVICES: ServiceConfig[] = [
  {
    name: 'identity',
    baseUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    routes: [
      { path: '/api/v1/auth/login', method: 'POST', rateLimit: 10, auth: false },
      { path: '/api/v1/auth/register', method: 'POST', rateLimit: 5, auth: false },
      { path: '/api/v1/auth/logout', method: 'POST', rateLimit: 30, auth: true },
      { path: '/api/v1/auth/profile', method: 'GET', rateLimit: 60, auth: true },
    ]
  },
  {
    name: 'promo',
    baseUrl: process.env.PROMO_SERVICE_URL || 'http://localhost:3002',
    routes: [
      { path: '/api/v1/promos', method: 'GET', rateLimit: 60, auth: false },
      { path: '/api/v1/promos', method: 'POST', rateLimit: 10, auth: true },
      { path: '/api/v1/promos/active', method: 'GET', rateLimit: 60, auth: false },
    ]
  },
  {
    name: 'venue',
    baseUrl: process.env.VENUE_SERVICE_URL || 'http://localhost:3003',
    routes: [
      { path: '/api/v1/venues', method: 'GET', rateLimit: 60, auth: false },
      { path: '/api/v1/venues/nearby', method: 'GET', rateLimit: 30, auth: false },
    ]
  }
];

// Rate limiting store
// NOTE: This in-memory store does not work across multiple serverless instances.
// For production with horizontal scaling, use Redis or an external rate limiting service.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientId(req: NextRequest): string {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) return 'apikey:' + apiKey;
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return 'ip:' + ip;
}

function checkRateLimit(clientId: string, limit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const record = rateLimitStore.get(clientId);
  
  if (!record || record.resetTime < now) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

function findRoute(pathname: string, method: string): { service: ServiceConfig; route: RouteConfig } | null {
  for (const service of SERVICES) {
    for (const route of service.routes) {
      if (route.path === pathname && (!route.method || route.method === method)) {
        return { service, route };
      }
    }
  }
  return null;
}

export async function gatewayMiddleware(req: NextRequest) {
  const { pathname, search } = new URL(req.url);
  
  const match = findRoute(pathname, req.method);
  if (!match) return NextResponse.next();
  
  const { service, route } = match;
  
  // Rate limiting
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, route.rateLimit)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Build target URL
  const targetUrl = service.baseUrl + pathname + search;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        'x-gateway': 'nightlife-id',
        'x-service': service.name,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('x-gateway', 'nightlife-id');
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Service unavailable', service: service.name },
      { status: 503 }
    );
  }
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
