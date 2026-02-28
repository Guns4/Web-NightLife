import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
 * User Roles for RBAC
 * - GUEST: Read only, Claim Promo
 * - VENUE_MANAGER: Manage own venue data, view specific analytics
 * - SUPER_ADMIN: Global audit, Verify Mystery Guest logs
 */
export type UserRole = "guest" | "venue_manager" | "super_admin";

/**
 * Route permission matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  guest: [
    "/",
    "/discovery",
    "/guides",
    "/partners",
    "/auth",
    "/api/ppc",
  ],
  venue_manager: [
    "/dashboard/owner",
    "/dashboard/marketing",
  ],
  super_admin: [
    "/dashboard/super-admin",
    "/dashboard/ops",
    "/admin",
    "/api/admin",
    "/api/cron",
  ],
};

/**
 * Check if user has permission to access route
 */
function hasPermission(role: string | null, pathname: string): boolean {
  if (!role) {
    // Guest permissions
    return ROLE_PERMISSIONS.guest.some(route => pathname.startsWith(route));
  }

  const userRole = role as UserRole;
  const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];
  
  // Check if pathname starts with any allowed route
  return allowedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Supabase Auth Middleware with RBAC
 * Handles route protection and user redirects
 */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile", "/venues/create"];
  
  // Owner-only routes
  const ownerRoutes = ["/dashboard/owner", "/venues/manage"];
  
  // Public routes
  const publicRoutes = ["/", "/venues", "/auth"];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isOwnerRoute = ownerRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // Redirect unauthenticated users trying to access protected routes
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check user role for owner routes
  if (user && isOwnerRoute) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Redirect non-owners trying to access owner routes
    if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // RBAC: Check role-based permissions
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "guest";
    
    // Check if user has permission for the requested path
    if (!hasPermission(userRole, pathname)) {
      // User doesn't have permission, redirect to appropriate dashboard
      if (userRole === "super_admin") {
        return NextResponse.redirect(new URL("/dashboard/super-admin", request.url));
      } else if (userRole === "owner") {
        return NextResponse.redirect(new URL("/dashboard/owner", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    // Guest user - check if they have permission
    if (!hasPermission(null, pathname)) {
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

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
