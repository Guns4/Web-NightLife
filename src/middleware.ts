import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase Auth Middleware
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
