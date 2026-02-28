/**
 * =====================================================
 * PARTNER API AUTH MIDDLEWARE
 * AfterHoursID - Scoped Authorization for Partners
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateApiKey, 
  getApiKeyByHash, 
  checkRateLimit, 
  hasScope,
  getPartnerById,
  logApiRequest,
  incrementPartnerRequests,
  updateApiKeyLastUsed,
  type ApiKey,
  type Partner
} from '@/lib/services/partners/api-key-service';

/**
 * Partner context attached to request
 */
export interface PartnerContext {
  apiKey: ApiKey;
  partner: Partner;
  rateLimit: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  };
}

/**
 * Extract API key from request
 */
function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('ApiKey ') || authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  // Try query parameter (less secure, but sometimes needed)
  const queryKey = request.nextUrl.searchParams.get('api_key');
  if (queryKey) {
    return queryKey;
  }
  
  return null;
}

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Create scoped authorization middleware factory
 */
export function createPartnerAuthMiddleware(requiredScope?: string) {
  return async function partnerAuth(
    request: NextRequest
  ): Promise<{ context: PartnerContext | null; response: NextResponse | null }> {
    const startTime = Date.now();
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Extract API key
    const plainKey = extractApiKey(request);
    
    if (!plainKey) {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'API key is required. Provide it via Authorization header, X-API-Key header, or api_key query parameter.',
            code: 'MISSING_API_KEY',
          },
          { status: 401 }
        ),
      };
    }
    
    // Validate API key
    // In production, use proper caching with Redis
    const apiKey = await getApiKeyByHash(
      // Would hash the key in production
      plainKey
    );
    
    if (!apiKey) {
      // Log failed attempt
      await logApiRequest({
        partner_id: 'unknown',
        api_key_id: 'unknown',
        endpoint: request.nextUrl.pathname,
        method: request.method,
        status_code: 401,
        response_time_ms: Date.now() - startTime,
        request_ip: clientIp,
        request_user_agent: userAgent,
        error_message: 'Invalid API key',
      });
      
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Invalid API key',
            code: 'INVALID_API_KEY',
          },
          { status: 401 }
        ),
      };
    }
    
    // Check if key is active
    if (!apiKey.is_active) {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'API key has been revoked',
            code: 'REVOKED_API_KEY',
          },
          { status: 403 }
        ),
      };
    }
    
    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'API key has expired',
            code: 'EXPIRED_API_KEY',
          },
          { status: 403 }
        ),
      };
    }
    
    // Check scope if required
    if (requiredScope && !hasScope(apiKey.scopes, requiredScope)) {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: `Required scope: ${requiredScope}`,
            code: 'INSUFFICIENT_SCOPE',
          },
          { status: 403 }
        ),
      };
    }
    
    // Check rate limit
    const rateLimit = checkRateLimit(
      apiKey.id,
      apiKey.rate_limit_quota,
      apiKey.rate_limit_window
    );
    
    if (!rateLimit.allowed) {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please upgrade your plan.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': apiKey.rate_limit_quota.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }
    
    // Get partner details
    const partner = await getPartnerById(apiKey.partner_id);
    
    if (!partner || partner.status !== 'active') {
      return {
        context: null,
        response: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Partner account is not active',
            code: 'INACTIVE_PARTNER',
          },
          { status: 403 }
        ),
      };
    }
    
    // Create context
    const context: PartnerContext = {
      apiKey,
      partner,
      rateLimit,
    };
    
    // Add rate limit headers to request for downstream handlers
    request.headers.set('x-partner-id', partner.id);
    request.headers.set('x-api-key-id', apiKey.id);
    request.headers.set('x-rate-limit-remaining', rateLimit.remaining.toString());
    
    // Update last used asynchronously (don't wait)
    updateApiKeyLastUsed(apiKey.id).catch(console.error);
    
    // Return context, no response means continue
    return { context, response: null };
  };
}

/**
 * Pre-defined middleware for different scopes
 */

// Require venues read scope
export const partnerAuthVenues = createPartnerAuthMiddleware('read:venues');

// Require promos read scope  
export const partnerAuthPromos = createPartnerAuthMiddleware('read:promos');

// Require events read scope
export const partnerAuthEvents = createPartnerAuthMiddleware('read:events');

// Require analytics read scope
export const partnerAuthAnalytics = createPartnerAuthMiddleware('read:analytics');

// Require reservations write scope
export const partnerAuthReservations = createPartnerAuthMiddleware('write:reservations');

// No scope required (basic auth)
export const partnerAuthBasic = createPartnerAuthMiddleware();

/**
 * Log response middleware (call after handler completes)
 */
export async function logPartnerResponse(
  request: NextRequest,
  response: NextResponse,
  context: PartnerContext | null,
  startTime: number,
  error?: Error
): Promise<void> {
  if (!context) return;
  
  const responseTime = Date.now() - startTime;
  const statusCode = response.status;
  
  await logApiRequest({
    partner_id: context.partner.id,
    api_key_id: context.apiKey.id,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    status_code: statusCode,
    response_time_ms: responseTime,
    request_ip: getClientIp(request),
    request_user_agent: request.headers.get('user-agent') || undefined,
    error_message: error?.message,
  });
  
  // Increment partner request count periodically (batch in production)
  if (Math.random() < 0.1) { // 10% sample to reduce DB writes
    await incrementPartnerRequests(context.partner.id).catch(console.error);
  }
}

/**
 * Rate limit headers helper
 */
export function getRateLimitHeaders(rateLimit: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Limit': '1000', // Would come from API key
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
  };
}
