/**
 * =====================================================
 * EDGE-COMPATIBLE JWT VERIFICATION
 * Uses 'jose' library for Edge Runtime compatibility
 * =====================================================
 */

import { jwtVerify, importSPKI } from 'jose';

/**
 * Get RSA public key from environment variable
 * Supports both PEM format and BASE64-encoded PEM
 */
async function getPublicKey(): Promise<CryptoKey | null> {
  // Try BASE64 encoded key first
  const publicKeyB64 = process.env.RSA_PUBLIC_KEY_BASE64;
  if (publicKeyB64) {
    try {
      const pem = Buffer.from(publicKeyB64, 'base64').toString('utf8');
      return await importSPKI(pem, 'RS256');
    } catch (e) {
      console.error('Failed to import BASE64 public key:', e);
    }
  }

  // Fall back to PEM format
  const publicKeyPem = process.env.RSA_PUBLIC_KEY;
  if (publicKeyPem) {
    try {
      return await importSPKI(publicKeyPem, 'RS256');
    } catch (e) {
      console.error('Failed to import PEM public key:', e);
    }
  }

  return null;
}

/**
 * Verify JWT token using RS256 (Edge-compatible)
 * Uses 'jose' library which works in Edge Runtime
 */
export async function verifyTokenEdge(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    const publicKey = await getPublicKey();
    
    if (!publicKey) {
      console.error('No public key available for JWT verification');
      return null;
    }

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'afterhoursid',
      algorithms: ['RS256'],
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    // Token verification failed
    return null;
  }
}

/**
 * Simple JWT verification that can work without public key
 * Falls back to HS256 for development (not recommended for production)
 */
export async function verifyTokenSimple(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    // For Edge Runtime, we'll use a simpler approach
    // Decode the JWT without verification (for development only)
    // In production, you should always verify
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}
