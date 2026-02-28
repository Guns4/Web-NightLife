/**
 * =====================================================
 * IDENTITY SERVICE - AUTH UTILITIES
 * Password Hashing & JWT Token Management
 * =====================================================
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// =====================================================
// TYPES
// =====================================================

export type UserRole = "GUEST" | "USER" | "OWNER" | "ADMIN" | "SUPER_ADMIN";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

// =====================================================
// CONFIGURATION
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "1h"; // 1 hour
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// Cookie names
export const ACCESS_TOKEN_COOKIE = "ah_access_token";
export const REFRESH_TOKEN_COOKIE = "ah_refresh_token";

// =====================================================
// PASSWORD HASHING (Bcrypt)
// =====================================================

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password needs to be rehashed (e.g., if salt rounds changed)
 * @param hash - Current hash
 * @returns Boolean indicating if rehash is needed
 */
export async function needsRehash(hash: string): Promise<boolean> {
  // Check if using old salt rounds (e.g., 10 instead of 12)
  const salt = hash.substring(0, 29); // bcrypt salt is $2a$XX$ + 22 chars
  return !salt.includes("$12$");
}

// =====================================================
// JWT TOKEN MANAGEMENT
// =====================================================

/**
 * Generate an access token
 * @param user - User data to encode
 * @returns JWT access token
 */
export function generateAccessToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email || "",
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: "afterhoursid",
  });
}

/**
 * Generate a refresh token
 * @param userId - User ID
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: "afterhoursid",
  });
}

/**
 * Generate both access and refresh tokens
 * @param user - User data
 * @returns TokenPair with both tokens
 */
export function generateTokenPair(user: AuthUser): TokenPair {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.id),
  };
}

/**
 * Verify an access token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "afterhoursid",
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "afterhoursid",
    }) as { userId: string; type: string };
    
    if (decoded.type !== "refresh") {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// =====================================================
// TOKEN STORAGE (HTTP-ONLY COOKIES)
// =====================================================

/**
 * Set authentication cookies (HTTP-only, secure)
 * @param tokens - TokenPair containing access and refresh tokens
 */
export async function setAuthCookies(tokens: TokenPair): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Set access token cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  // Set refresh token cookie
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Clear authentication cookies (for logout)
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Get access token from cookies
 * @returns Access token or null
 */
export async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

/**
 * Get refresh token from cookies
 * @returns Refresh token or null
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

// =====================================================
// TOKEN REVOCATION (In-memory store for demo)
// =====================================================

// Set of revoked token IDs (in production, use Redis or database)
const revokedTokens = new Set<string>();

/**
 * Revoke a token (add to blacklist)
 * @param tokenId - Token ID (can be the full token or a jti)
 */
export function revokeToken(tokenId: string): void {
  revokedTokens.add(tokenId);
}

/**
 * Check if a token is revoked
 * @param tokenId - Token ID to check
 * @returns Boolean indicating if token is revoked
 */
export function isTokenRevoked(tokenId: string): boolean {
  return revokedTokens.has(tokenId);
}

/**
 * Clean up expired revoked tokens (call periodically)
 */
export function cleanupRevokedTokens(): void {
  // In production, this would handle time-based cleanup
  // For now, tokens stay revoked until server restart
}

// =====================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================

/**
 * Check if a role has permission to access a route
 */
export function hasRolePermission(role: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(role);
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardByRole(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/super-admin";
    case "OWNER":
      return "/dashboard/owner";
    case "ADMIN":
      return "/dashboard/admin";
    case "USER":
      return "/dashboard";
    default:
      return "/";
  }
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Check if user can access owner routes
 */
export function canAccessOwner(role: UserRole): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}
