import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service routing configuration
const SERVICE_ROUTES: Record<string, {
  type: 'supabase' | 'mongodb' | 'function';
  table?: string;
  endpoint?: string;
}> = {
  // Core data (Supabase)
  'venues': { type: 'supabase', table: 'venues' },
  'profiles': { type: 'supabase', table: 'profiles' },
  'bookings': { type: 'supabase', table: 'bookings' },
  'checkins': { type: 'supabase', table: 'checkins' },
  'reviews': { type: 'supabase', table: 'reviews' },
  'promos': { type: 'supabase', table: 'promos' },
  'ads-orders': { type: 'supabase', table: 'ads_orders' },
  
  // Analytics (Supabase)
  'analytics': { type: 'supabase', table: 'analytics_events' },
  'analytics-finance': { type: 'supabase', table: 'analytics_finance' },
  
  // Social (Supabase)
  'friendships': { type: 'supabase', table: 'friendships' },
  'squad-bookings': { type: 'supabase', table: 'squad_bookings' },
  'vibe-invites': { type: 'supabase', table: 'vibe_invites' },
  
  // AI/ML (Function)
  'ai-recommendations': { type: 'function', endpoint: '/api/ai/recommendations' },
  'ai-insights': { type: 'function', endpoint: '/api/ai/insights' },
  'vibe-match': { type: 'function', endpoint: '/api/vibe/match' },
};

// Rate limiting store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * API Gateway - Routes requests to appropriate backend service
 * Maintains Single Source of Truth by centralizing database access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    
    // Validate service
    const serviceConfig = SERVICE_ROUTES[service];
    if (!serviceConfig) {
      return NextResponse.json(
        { error: `Unknown service: ${service}` },
        { status: 404 }
      );
    }

    // Check rate limit for GPS verification endpoint
    if (service === 'checkins') {
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      const rateLimitResult = checkRateLimit(`gps-${clientIp}`, 10, 60000); // 10 req/min
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const filters = Object.fromEntries(searchParams);

    // Route to appropriate backend
    if (serviceConfig.type === 'supabase') {
      return handleSupabaseRequest(serviceConfig.table!, id, filters);
    } else if (serviceConfig.type === 'function') {
      return handleFunctionRequest(serviceConfig.endpoint!, filters);
    }

    return NextResponse.json(
      { error: 'Invalid service configuration' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Gateway] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    
    // Validate service
    const serviceConfig = SERVICE_ROUTES[service];
    if (!serviceConfig) {
      return NextResponse.json(
        { error: `Unknown service: ${service}` },
        { status: 404 }
      );
    }

    // Check rate limit for write operations
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`write-${clientIp}`, 30, 60000); // 30 req/min
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get request body
    const body = await request.json();

    // Route to appropriate backend
    if (serviceConfig.type === 'supabase') {
      return handleSupabaseWrite(serviceConfig.table!, body);
    }

    return NextResponse.json(
      { error: 'Invalid service configuration' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Gateway] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle Supabase (Core Database) requests
 */
async function handleSupabaseRequest(
  table: string,
  id: string | null,
  filters: Record<string, string>
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  let query = supabase.from(table).select('*');

  if (id) {
    query = query.eq('id', id);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== 'id' && value) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ data });
}

/**
 * Handle Supabase write operations
 */
async function handleSupabaseWrite(
  table: string,
  body: Record<string, unknown>
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from(table)
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}

/**
 * Handle internal function calls
 */
async function handleFunctionRequest(
  endpoint: string,
  filters: Record<string, string>
) {
  // In production, this would call the actual function
  // For now, return a placeholder
  return NextResponse.json({
    message: `Function ${endpoint} would be called with filters`,
    filters
  });
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis for distributed rate limiting
 */
function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  record.count++;
  rateLimitMap.set(key, record);

  return { allowed: true, remaining: maxRequests - record.count };
}
