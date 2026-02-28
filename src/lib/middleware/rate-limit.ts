/**
 * =====================================================
 * RATE LIMITING MIDDLEWARE
 * AfterHoursID - Bot & DDoS Defense
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration per endpoint
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skip?: (req: NextRequest) => boolean;
  handler?: (req: NextRequest, res: NextResponse) => NextResponse;
}

/**
 * In-memory store for rate limiting (use Redis in production)
 * Format: Map<key, { count: number, resetTime: number }>
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries periodically
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
    lastCleanup = now;
  }
}

/**
 * Generate rate limit key from request
 */
function generateKey(req: NextRequest, type: 'ip' | 'user' | 'api' = 'ip'): string {
  switch (type) {
    case 'user':
      // Use user ID if authenticated
      const userId = req.headers.get('x-user-id');
      return userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
    case 'api':
      // Use API key
      const apiKey = req.headers.get('x-api-key');
      return apiKey ? `api:${apiKey}` : `ip:${getClientIp(req)}`;
    default:
      return `ip:${getClientIp(req)}`;
  }
}

/**
 * Get client IP from request headers
 */
function getClientIp(req: NextRequest): string {
  // Check various headers for client IP (handles proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Check if request should bypass rate limiting
 */
function shouldSkip(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  
  // Skip health checks
  if (path === '/api/health' || path === '/health') {
    return true;
  }
  
  // Skip internal IPs
  const ip = getClientIp(req);
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    return true;
  }
  
  return false;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | null> {
    // Skip if configured
    if (config.skip && config.skip(req)) {
      return null;
    }
    
    // Skip certain requests
    if (shouldSkip(req)) {
      return null;
    }
    
    // Cleanup old entries
    cleanupStore();
    
    // Generate key
    const keyType = config.keyGenerator ? 'custom' : 'ip';
    const key = config.keyGenerator 
      ? config.keyGenerator(req) 
      : generateKey(req, keyType === 'custom' ? 'ip' : 'ip');
    
    const now = Date.now();
    const windowMs = config.windowMs || 60000; // Default 1 minute
    const maxRequests = config.maxRequests || 100;
    
    // Get or create entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // New window
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }
    
    // Increment count
    entry.count++;
    
    // Calculate remaining
    const remaining = Math.max(0, maxRequests - entry.count);
    
    // Create response headers
    const responseHeaders = new Headers();
    responseHeaders.set('X-RateLimit-Limit', maxRequests.toString());
    responseHeaders.set('X-RateLimit-Remaining', remaining.toString());
    responseHeaders.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    
    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      responseHeaders.set('Retry-After', retryAfter.toString());
      
      // Log rate limit exceeded
      console.log(`[RATE LIMIT] Exceeded: ${key} (${entry.count}/${maxRequests})`);
      
      // Return 429 response
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: responseHeaders,
        }
      );
      
      // Add custom handler if provided
      if (config.handler) {
        return config.handler(req, response);
      }
      
      return response;
    }
    
    // Add headers to successful response
    // Note: We'll add these headers in the final response via the response callback
    
    return null; // Continue to next middleware/handler
  };
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  req: NextRequest,
  res: NextResponse,
  key: string
): NextResponse {
  const entry = rateLimitStore.get(key);
  const maxRequests = 100; // Default
  
  if (entry) {
    const remaining = Math.max(0, maxRequests - entry.count);
    res.headers.set('X-RateLimit-Limit', maxRequests.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
  }
  
  return res;
}

// =====================================================
// PREDEFINED RATE LIMITERS
// =====================================================

/**
 * Strict rate limit for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
  keyGenerator: (req) => `auth:${getClientIp(req)}`,
  skip: (req) => {
    const path = req.nextUrl.pathname;
    return !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/register');
  },
});

/**
 * Standard API rate limit
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyGenerator: (req) => generateKey(req, 'ip'),
  skip: shouldSkip,
});

/**
 * Strict rate limit for write operations
 */
export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 writes per minute
  keyGenerator: (req) => `write:${generateKey(req, 'user')}`,
  skip: (req) => req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE',
});

/**
 * Search rate limit
 */
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  keyGenerator: (req) => `search:${getClientIp(req)}`,
  skip: (req) => !req.nextUrl.pathname.includes('/search'),
});

/**
 * File upload rate limit
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 uploads per minute
  keyGenerator: (req) => `upload:${generateKey(req, 'user')}`,
  skip: (req) => !req.nextUrl.pathname.includes('/upload'),
});

/**
 * Webhook rate limit (very strict for third-party)
 */
export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 webhooks per minute
  keyGenerator: (req) => `webhook:${req.headers.get('x-webhook-source') || getClientIp(req)}`,
  skip: (req) => !req.nextUrl.pathname.includes('/webhooks'),
});

/**
 * IP-based ban check
 */
export function checkIpBan(req: NextRequest): NextResponse | null {
  const clientIp = getClientIp(req);
  const bannedIps: string[] = [
    // Add banned IPs here or fetch from database
  ];
  
  if (bannedIps.includes(clientIp)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Your IP has been banned.',
      },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * DDOS protection - flag suspicious requests
 */
export function detectDdos(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';
  
  // Check for common DDoS patterns
  const suspiciousPatterns = [
    // Missing user agent
    !userAgent,
    // Missing accept header
    !accept,
    // Known bot user agents
    userAgent.toLowerCase().includes('bot') || 
    userAgent.toLowerCase().includes('crawler'),
    // Very long user agent
    userAgent.length > 500,
  ];
  
  return suspiciousPatterns.filter(Boolean).length > 1;
}
