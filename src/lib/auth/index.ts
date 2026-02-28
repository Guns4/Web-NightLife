/**
 * =====================================================
 * AUTH LIBRARY - MAIN EXPORTS
 * =====================================================
 */

// Re-export specific items to avoid naming conflicts
export { 
  hashPassword, 
  verifyPassword, 
  generateTokenPair,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  revokeToken,
  isTokenRevoked,
  hasRolePermission,
  getDashboardByRole,
  canAccessAdmin,
  canAccessOwner,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type JWTPayload,
  type TokenPair,
  type UserRole,
} from "./auth-utils";

export { prisma } from "./prisma-client";

export { 
  useAuthStore, 
  useHasRole, 
  useCanAccessAdmin, 
  useCanAccessOwner, 
  getDashboardUrl,
  type AuthUser,
} from "./store";
