/**
 * =====================================================
 * CSRF PROTECTION
 * Token-based CSRF protection for API routes
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_TOKEN_COOKIE);
  return csrfCookie?.value || null;
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations
 */
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  const method = request.method;
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Skip CSRF for non-origin requests (same-origin only)
  const origin = request.headers.get("origin") || request.headers.get("host");
  const referer = request.headers.get("referer");

  // Allow server-to-server or cron requests
  if (!origin && !referer) {
    return true;
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get(CSRF_HEADER);

  if (!csrfToken) {
    console.warn("CSRF token missing from request");
    return false;
  }

  // Get stored CSRF token from cookies
  const storedToken = await getCSRFToken();

  if (!storedToken) {
    console.warn("No stored CSRF token found");
    return false;
  }

  // Compare tokens (constant-time comparison)
  if (!timingSafeEqual(csrfToken, storedToken)) {
    console.warn("CSRF token mismatch");
    return false;
  }

  return true;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create CSRF response with token set
 */
export async function createCSRFResponse(
  response: NextResponse
): Promise<NextResponse> {
  // Generate new CSRF token
  const csrfToken = generateCSRFToken();

  // Set CSRF token cookie (HTTPOnly for security)
  response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Also set in header for JavaScript access (non-HttpOnly)
  response.headers.set("X-CSRF-Token", csrfToken);

  return response;
}

/**
 * CSRF middleware wrapper for API routes
 */
export function withCSRF(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function csrfMiddleware(req: NextRequest): Promise<NextResponse> {
    // Validate CSRF token
    const isValid = await validateCSRF(req);

    if (!isValid) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    // Process request
    const response = await handler(req);

    // Add CSRF token to response
    return createCSRFResponse(response);
  };
}
