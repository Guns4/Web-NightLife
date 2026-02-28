/**
 * =====================================================
 * API GATEWAY HARDENING
 * AfterHoursID - Rate Limiting, Tracing, Security Headers
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

// Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Types
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface TracingContext {
  correlationId: string;
  requestId: string;
  timestamp: string;
  spanId: string;
}

// Rate limit configs per endpoint type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  auth: { windowMs: 300000, maxRequests: 10 },   // 10 req/5min (login attempts)
  api: { windowMs: 60000, maxRequests: 1000 },   // 1000 req/min for API
  critical: { windowMs: 60000, maxRequests: 50 }, // 50 req/min for sensitive ops
};

// =====================================================
// CORRELATION ID & TRACING
// =====================================================

/**
 * Generate or extract correlation ID
 */
export function getCorrelationId(request: NextRequest): string {
  // Check if correlation ID exists in headers
  const existingId = request.headers.get('x-correlation-id');
  if (existingId) return existingId;

  // Generate new correlation ID
  return `corr-${randomUUID()}`;
}

/**
 * Create tracing context
 */
export function createTracingContext(request: NextRequest): TracingContext {
  const correlationId = getCorrelationId(request);
  
  return {
    correlationId,
    requestId: `req-${randomUUID()}`,
    timestamp: new Date().toISOString(),
    spanId: `span-${Math.random().toString(36).substring(2, 15)}`,
  };
}

/**
 * Add tracing headers to response
 */
export function addTracingHeaders(
  response: NextResponse,
  context: TracingContext
): NextResponse {
  response.headers.set('X-Correlation-ID', context.correlationId);
  response.headers.set('X-Request-ID', context.requestId);
  response.headers.set('X-Timestamp', context.timestamp);
  response.headers.set('X-Span-ID', context.spanId);
  
  return response;
}

// =====================================================
// SECURITY HEADERS
// =====================================================

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // HSTS - Force HTTPS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.afterhours.id wss:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  return response;
}

// =====================================================
// RATE LIMITING - LEAKY BUCKET ALGORITHM
// =====================================================

/**
 * Get rate limit key for Redis
 */
function getRateLimitKey(identifier: string, endpoint: string): string {
  return `ratelimit:${endpoint}:${identifier}`;
}

/**
 * Check rate limit using leaky bucket algorithm
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string = 'default'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();
  const windowMs = config.windowMs;
  
  try {
    // Get current bucket state
    const current = await redis.get(key);
    
    if (!current) {
      // First request - initialize bucket
      await redis.setex(key, Math.ceil(windowMs / 1000), '1');
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + windowMs,
      };
    }
    
    const requestCount = parseInt(current, 10);
    
    if (requestCount >= config.maxRequests) {
      // Bucket full - rate limited
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl * 1000),
      };
    }
    
    // Increment bucket
    await redis.incr(key);
    
    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: now + windowMs,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Middleware for rate limiting
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Get identifier (API key or IP)
  const apiKey = request.headers.get('x-api-key');
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const identifier = apiKey || ip || 'unknown';
  
  // Determine endpoint type
  let endpoint = 'default';
  if (request.url.includes('/auth/')) endpoint = 'auth';
  else if (request.url.includes('/api/')) endpoint = 'api';
  else if (request.url.includes('/payment') || request.url.includes('/booking')) endpoint = 'critical';
  
  const result = await checkRateLimit(identifier, endpoint);
  
  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    );
    
    response.headers.set('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS[endpoint].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
    
    return { allowed: false, response };
  }
  
  return { allowed: true };
}

// =====================================================
// MAIN GATEWAY MIDDLEWARE
// =====================================================

/**
 * Process request through gateway hardening
 */
export async function gatewayMiddleware(
  request: NextRequest
): Promise<{ response?: NextResponse; shouldContinue: boolean }> {
  // 1. Create tracing context
  const tracingContext = createTracingContext(request);
  
  // 2. Check rate limit
  const rateLimitResult = await rateLimitMiddleware(request);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    addTracingHeaders(rateLimitResult.response, tracingContext);
    applySecurityHeaders(rateLimitResult.response);
    return { response: rateLimitResult.response, shouldContinue: false };
  }
  
  // 3. Continue with request - add headers to downstream
  const response = NextResponse.next();
  
  // Add tracing headers to downstream request
  request.headers.set('X-Correlation-ID', tracingContext.correlationId);
  request.headers.set('X-Request-ID', tracingContext.requestId);
  
  // Add rate limit headers to response
  const endpoint = request.url.includes('/auth/') ? 'auth' : 
                   request.url.includes('/api/') ? 'api' : 'default';
  const config = RATE_LIMITS[endpoint];
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', (rateLimitResult.allowed ? 
    (config.maxRequests - 1).toString() : '0'));
  
  // Apply security headers
  addTracingHeaders(response, tracingContext);
  applySecurityHeaders(response);
  
  return { response, shouldContinue: true };
}

/**
 * Cleanup Redis connection
 */
export async function cleanupGateway(): Promise<void> {
  await redis.quit();
}
