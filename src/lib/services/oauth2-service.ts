/**
 * =====================================================
 * OAUTH2 & ACCOUNT SECURITY
 * AfterHoursID - Google OAuth, Session Management
 * =====================================================
 */

import { randomBytes, createHash } from 'crypto';

// Types
export interface OAuthProfile {
  provider: 'google';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Session {
  id: string;
  userId: string;
  device: string;
  ip: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
}

export interface RecoveryToken {
  token: string;
  userId: string;
  type: 'password_reset' | 'email_verification';
  expiresAt: Date;
  used: boolean;
}

// Session store (use Redis in production)
const sessions = new Map<string, Session>();
const recoveryTokens = new Map<string, RecoveryToken>();

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/google',
  },
};

/**
 * Generate OAuth URL for Google
 */
export function getGoogleOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.google.clientId,
    redirect_uri: OAUTH_CONFIG.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  id_token: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: OAUTH_CONFIG.google.clientId,
      client_secret: OAUTH_CONFIG.google.clientSecret,
      redirect_uri: OAUTH_CONFIG.google.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  
  return response.json();
}

/**
 * Get user profile from Google
 */
export async function getGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  const data = await response.json();
  
  return {
    provider: 'google',
    providerId: data.id,
    email: data.email,
    name: data.name,
    avatar: data.picture,
  };
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  device: string,
  ip: string
): Promise<Session> {
  const session: Session = {
    id: randomBytes(32).toString('hex'),
    userId,
    device,
    ip,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    lastActive: new Date(),
  };
  
  sessions.set(session.id, session);
  
  // In production, store in Redis with TTL
  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const session = sessions.get(sessionId);
  
  if (!session) return null;
  
  // Check expiration
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  
  // Update last active
  session.lastActive = new Date();
  sessions.set(sessionId, session);
  
  return session;
}

/**
 * Revoke session (remote logout)
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  return sessions.delete(sessionId);
}

/**
 * Revoke all user sessions
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  let count = 0;
  
  for (const [id, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(id);
      count++;
    }
  }
  
  return count;
}

/**
 * Get all user sessions
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const userSessions: Session[] = [];
  
  for (const session of sessions.values()) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }
  
  return userSessions;
}

// =====================================================
// ACCOUNT RECOVERY
// =====================================================

/**
 * Generate recovery token
 */
export async function generateRecoveryToken(
  userId: string,
  type: 'password_reset' | 'email_verification'
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const encryptedToken = createHash('sha256').update(token).digest('hex');
  
  const recovery: RecoveryToken = {
    token: encryptedToken,
    userId,
    type,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    used: false,
  };
  
  recoveryTokens.set(encryptedToken, recovery);
  
  return token; // Return plain token (send via email)
}

/**
 * Verify recovery token
 */
export async function verifyRecoveryToken(
  plainToken: string
): Promise<{ valid: boolean; userId?: string; type?: string }> {
  const encryptedToken = createHash('sha256').update(plainToken).digest('hex');
  const recovery = recoveryTokens.get(encryptedToken);
  
  if (!recovery) {
    return { valid: false };
  }
  
  if (recovery.used) {
    return { valid: false };
  }
  
  if (recovery.expiresAt < new Date()) {
    return { valid: false };
  }
  
  return {
    valid: true,
    userId: recovery.userId,
    type: recovery.type,
  };
}

/**
 * Mark recovery token as used
 */
export async function useRecoveryToken(plainToken: string): Promise<boolean> {
  const encryptedToken = createHash('sha256').update(plainToken).digest('hex');
  const recovery = recoveryTokens.get(encryptedToken);
  
  if (!recovery || recovery.used) {
    return false;
  }
  
  recovery.used = true;
  recoveryTokens.set(encryptedToken, recovery);
  
  return true;
}

/**
 * Cleanup expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  let count = 0;
  const now = new Date();
  
  for (const [token, recovery] of recoveryTokens.entries()) {
    if (recovery.expiresAt < now || recovery.used) {
      recoveryTokens.delete(token);
      count++;
    }
  }
  
  return count;
}
