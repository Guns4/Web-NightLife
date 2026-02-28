/**
 * =====================================================
 * AFTERHOURS ID - AUTH MIDDLEWARE
 * JWT-based route protection with role-based access
 * =====================================================
 */

import { NextResponse, type NextRequest } from "next/server";
import { 
  verifyAccessToken, 
  getAccessTokenFromCookie,
  canAccessAdmin,
  canAccessOwner,
  getDashboardByRole,
  type UserRole 
} from "@/lib/auth/auth-utils";
import { hasPermission, isSuperAdmin, type Permission } from "@/lib/auth/rbac";

// Rate limiting map for GPS verification endpoint
const gpsRateLimit = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for GPS verification (Edge-level)
 * Prevents abuse/spoofing of GPS check-ins
 */
function checkGpsRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute
  
  const record = gpsRateLimit.get(ip);
  
  if (!record || now > record.resetTime) {
    gpsRateLimit.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  gpsRateLimit.set(ip, record);
  return true;
}

/**
 * Route permission matrix by role
 */
const PUBLIC_ROUTES = [
  "/",
  "/discovery",
  "/guides",
  "/partners",
  "/auth/signin",
  "/auth/signup",
  "/auth/callback",
  "/api/ppc",
  "/api/v1/venues",
  "/api/auth/register",
  "/api/auth/login",
];

const ADMIN_ROUTES = [
  "/admin",
  "/dashboard/super-admin",
  "/dashboard/ops",
  "/api/admin",
  "/api/cron",
];

// Routes that require SUPER_ADMIN role only
const SUPER_ADMIN_ONLY_ROUTES = [
  "/admin/settings",
  "/admin/finance",
  "/api/admin/settings",
  "/api/admin/config",
  "/api/admin/tiers",
];

// Routes that allow both ADMIN and SUPER_ADMIN
const ADMIN_MODERATION_ROUTES = [
  "/admin/moderation",
  "/admin/reviews",
  "/api/admin/reviews",
];

const OWNER_ROUTES = [
  "/dashboard/owner",
  "/dashboard/marketing",
  "/dashboard/admin",
  "/venue",
];

const PROTECTED_USER_ROUTES = [
  "/dashboard",
  "/profile",
  "/wallet",
  "/checkin",
];

/**
 * Check if route matches any prefix
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Extract JWT from request
 */
async function getJWTFromRequest(request: NextRequest): Promise<string | null> {
  // First try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // Fall back to cookie
  return getAccessTokenFromCookie();
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting for GPS check-in endpoints (Edge-level)
  if (pathname.includes('/api/checkin') || pathname.includes('/api/verify-gps')) {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkGpsRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Skip API routes that handle their own auth
  if (pathname.startsWith("/api/auth/")) {
    // Allow register and login endpoints
    if (pathname.includes("/api/auth/register") || pathname.includes("/api/auth/login")) {
      return NextResponse.next();
    }
    // For other auth endpoints (me, refresh, logout), let them handle their own auth
    return NextResponse.next();
  }

  // Check if it's a public route
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getJWTFromRequest(request);
  
  // If no token, redirect to login for protected routes
  if (!token) {
    // Check if trying to access protected route
    if (
      matchesRoute(pathname, PROTECTED_USER_ROUTES) ||
      matchesRoute(pathname, ADMIN_ROUTES) ||
      matchesRoute(pathname, OWNER_ROUTES)
    ) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Verify the JWT
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    // Token invalid or expired
    // Try to refresh using refresh token endpoint
    if (
      matchesRoute(pathname, PROTECTED_USER_ROUTES) ||
      matchesRoute(pathname, ADMIN_ROUTES) ||
      matchesRoute(pathname, OWNER_ROUTES)
    ) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const userRole = payload.role as UserRole;

  // Check admin route access
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!canAccessAdmin(userRole)) {
      // Redirect to appropriate dashboard
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }
  }

  // Check SUPER_ADMIN only routes
  if (matchesRoute(pathname, SUPER_ADMIN_ONLY_ROUTES)) {
    if (!isSuperAdmin(userRole)) {
      // Redirect to admin dashboard with error
      const adminUrl = new URL("/admin", request.url);
      adminUrl.searchParams.set("error", "super_admin_only");
      return NextResponse.redirect(adminUrl);
    }
  }

  // Check admin moderation routes (ADMIN and SUPER_ADMIN allowed)
  if (matchesRoute(pathname, ADMIN_MODERATION_ROUTES)) {
    if (!canAccessAdmin(userRole)) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }
  }

  // Check owner route access
  if (matchesRoute(pathname, OWNER_ROUTES)) {
    if (!canAccessOwner(userRole)) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }
  }

  // Check protected user routes
  if (matchesRoute(pathname, PROTECTED_USER_ROUTES)) {
    // All authenticated users can access their dashboard
    // But we could add more granular role checks here
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
