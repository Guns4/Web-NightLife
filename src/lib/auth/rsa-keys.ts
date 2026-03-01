/**
 * =====================================================
 * RSA KEY MANAGEMENT
 * Generate and manage RSA key pairs for JWT signing
 * EDGE COMPATIBLE VERSION - Uses env vars only, no fs/path
 * =====================================================
 */

/**
 * Get RSA keys from environment variables (BASE64 encoded)
 * This is the preferred method for Edge Runtime compatibility
 */
export function getRSAKeysFromEnv(): { privateKey: string; publicKey: string } | null {
  const privateKeyB64 = process.env.RSA_PRIVATE_KEY_BASE64;
  const publicKeyB64 = process.env.RSA_PUBLIC_KEY_BASE64;
  
  if (privateKeyB64 && publicKeyB64) {
    try {
      const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
      const publicKey = Buffer.from(publicKeyB64, 'base64').toString('utf8');
      return { privateKey, publicKey };
    } catch (e) {
      console.error('Failed to decode RSA keys from base64 env vars:', e);
      return null;
    }
  }
  return null;
}

/**
 * Get RSA keys from environment variables (PEM format)
 */
export function getRSAKeysFromEnvPEM(): { privateKey: string; publicKey: string } | null {
  const privateKey = process.env.RSA_PRIVATE_KEY;
  const publicKey = process.env.RSA_PUBLIC_KEY;

  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }
  return null;
}

/**
 * Get RSA keys - Priority:
 * 1. Environment variables (BASE64 encoded - for Edge Runtime)
 * 2. Environment variables (PEM format - for Server Runtime)
 * 
 * Note: File system operations removed for Edge Runtime compatibility
 */
export function getRSAKeys(): { privateKey: string; publicKey: string } {
  // First try BASE64 env vars (Edge compatible)
  const envKeys = getRSAKeysFromEnv();
  if (envKeys) {
    return envKeys;
  }

  // Fall back to PEM format env vars
  const pemKeys = getRSAKeysFromEnvPEM();
  if (pemKeys) {
    return pemKeys;
  }

  // If no keys configured, throw error with helpful message
  throw new Error(
    'RSA keys not configured. Please set either:\n' +
    '- RSA_PRIVATE_KEY_BASE64 and RSA_PUBLIC_KEY_BASE64 (for Edge Runtime), or\n' +
    '- RSA_PRIVATE_KEY and RSA_PUBLIC_KEY (PEM format)'
  );
}

export default {
  getRSAKeys,
  getRSAKeysFromEnv,
  getRSAKeysFromEnvPEM,
};
