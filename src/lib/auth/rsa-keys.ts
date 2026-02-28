/**
 * =====================================================
 * RSA KEY MANAGEMENT
 * Generate and manage RSA key pairs for JWT signing
 * =====================================================
 */

import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Key directory
const KEYS_DIR = process.env.KEYS_DIR || './keys';

// Key file paths
const PRIVATE_KEY_PATH = join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = join(KEYS_DIR, 'public.pem');

/**
 * Generate RSA key pair
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}

/**
 * Ensure keys exist, generate if not
 */
export function ensureKeys(): { privateKey: string; publicKey: string } {
  try {
    if (existsSync(PRIVATE_KEY_PATH) && existsSync(PUBLIC_KEY_PATH)) {
      return {
        privateKey: readFileSync(PRIVATE_KEY_PATH, 'utf8'),
        publicKey: readFileSync(PUBLIC_KEY_PATH, 'utf8'),
      };
    }
  } catch (error) {
    console.log('Keys not found, generating new key pair...');
  }

  // Generate new keys
  const { privateKey, publicKey } = generateKeyPair();

  // Ensure directory exists (simplified - in production use proper fs handling)
  try {
    const fs = require('fs');
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }
    writeFileSync(PRIVATE_KEY_PATH, privateKey);
    writeFileSync(PUBLIC_KEY_PATH, publicKey);
    console.log('RSA keys generated and saved');
  } catch (e) {
    // In some environments (like serverless), we can't save files
    console.warn('Could not save keys to disk, using in-memory keys');
  }

  return { privateKey, publicKey };
}

/**
 * Get RSA keys from environment or generate
 */
export function getRSAKeys(): { privateKey: string; publicKey: string } {
  const privateKey = process.env.RSA_PRIVATE_KEY;
  const publicKey = process.env.RSA_PUBLIC_KEY;

  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  return ensureKeys();
}

export default {
  generateKeyPair,
  ensureKeys,
  getRSAKeys,
};
