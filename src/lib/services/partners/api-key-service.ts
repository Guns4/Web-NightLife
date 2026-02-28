/**
 * =====================================================
 * PARTNER API KEY SERVICE
 * AfterHoursID - B2B Partner Platform
 * =====================================================
 */

import { randomBytes, createHash } from 'crypto';

// Types
export interface Partner {
  id: string;
  name: string;
  slug: string;
  email: string;
  website?: string;
  description?: string;
  logo_url?: string;
  tier: 'basic' | 'professional' | 'enterprise';
  primary_color: string;
  custom_domain?: string;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_events: string[];
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  total_requests: number;
  monthly_requests: number;
  last_request_at?: Date;
  contact_name?: string;
  contact_phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  partner_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  rate_limit_quota: number;
  rate_limit_window: number;
  is_active: boolean;
  expires_at?: Date;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyCreateInput {
  partner_id: string;
  name: string;
  scopes: string[];
  rate_limit_quota?: number;
  rate_limit_window?: number;
  expires_at?: Date;
}

export interface PartnerApiLog {
  id: number;
  partner_id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  request_ip?: string;
  request_user_agent?: string;
  request_body?: object;
  response_body?: object;
  error_message?: string;
  created_at: Date;
}

// Rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Valid scopes
export const VALID_SCOPES = [
  'read:venues',
  'read:promos',
  'read:events',
  'read:analytics',
  'write:reservations',
] as const;

export type ValidScope = typeof VALID_SCOPES[number];

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `ah_live_${randomBytes(24).toString('hex')}`;
  const prefix = key.substring(0, 12); // ah_live_xxxx
  const hash = createHash('sha256').update(key).digest('hex');
  
  return { key, prefix, hash };
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate scopes
 */
export function validateScopes(scopes: string[]): boolean {
  return scopes.every(scope => VALID_SCOPES.includes(scope as ValidScope));
}

/**
 * Check rate limit for API key
 */
export function checkRateLimit(
  keyId: string, 
  quota: number, 
  windowSeconds: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const key = `api_key:${keyId}`;
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  entry.count++;
  const remaining = Math.max(0, quota - entry.count);
  
  return {
    allowed: entry.count <= quota,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for API key
 */
export function resetRateLimit(keyId: string): void {
  const key = `api_key:${keyId}`;
  rateLimitStore.delete(key);
}

// Mock database functions (replace with actual Prisma calls in production)

/**
 * Create a new partner
 */
export async function createPartner(data: {
  name: string;
  slug: string;
  email: string;
  website?: string;
  description?: string;
  tier?: 'basic' | 'professional' | 'enterprise';
  contact_name?: string;
  contact_phone?: string;
}): Promise<Partner> {
  // In production, this would be a Prisma call
  const partner: Partner = {
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    email: data.email,
    website: data.website,
    description: data.description,
    tier: data.tier || 'basic',
    primary_color: '#FFD700',
    webhook_events: [],
    status: 'pending',
    total_requests: 0,
    monthly_requests: 0,
    contact_name: data.contact_name,
    contact_phone: data.contact_phone,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  console.log(`[Partner Service] Created partner: ${partner.id}`);
  return partner;
}

/**
 * Create a new API key for a partner
 */
export async function createApiKey(input: ApiKeyCreateInput): Promise<{ apiKey: ApiKey; plainKey: string }> {
  // Generate the key
  const { key, prefix, hash } = generateApiKey();
  
  // Default rate limits based on tier (would fetch from partner in production)
  const defaultQuota = input.rate_limit_quota || 1000; // Daily
  const defaultWindow = input.rate_limit_window || 86400; // 1 day
  
  const apiKey: ApiKey = {
    id: crypto.randomUUID(),
    partner_id: input.partner_id,
    key_hash: hash,
    key_prefix: prefix,
    name: input.name,
    scopes: input.scopes,
    rate_limit_quota: defaultQuota,
    rate_limit_window: defaultWindow,
    is_active: true,
    expires_at: input.expires_at,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  console.log(`[Partner Service] Created API key: ${apiKey.id} for partner: ${input.partner_id}`);
  
  return { apiKey, plainKey: key };
}

/**
 * Validate an API key
 */
export async function validateApiKey(plainKey: string): Promise<ApiKey | null> {
  const hash = hashApiKey(plainKey);
  
  // In production, query database
  // const apiKey = await prisma.partnerApiKeys.findUnique({
  //   where: { key_hash: hash, is_active: true },
  //   include: { partner: true }
  // });
  
  // Mock validation - in production this would be a DB lookup
  console.log(`[Partner Service] Validating API key: ${plainKey.substring(0, 12)}...`);
  
  // Return mock for now - in production, query actual DB
  return null; // Would return the key if found
}

/**
 * Get API key by hash
 */
export async function getApiKeyByHash(hash: string): Promise<ApiKey | null> {
  // In production: Prisma query
  console.log(`[Partner Service] Looking up API key by hash`);
  return null;
}

/**
 * Get partner by ID
 */
export async function getPartnerById(id: string): Promise<Partner | null> {
  // In production: Prisma query
  return null;
}

/**
 * Log API request
 */
export async function logApiRequest(log: Omit<PartnerApiLog, 'id' | 'created_at'>): Promise<void> {
  // In production: Prisma create
  console.log(`[Partner API] ${log.method} ${log.endpoint} - ${log.status_code} (${log.response_time_ms}ms)`);
}

/**
 * Update API key last used
 */
export async function updateApiKeyLastUsed(keyId: string): Promise<void> {
  // In production: Prisma update
  console.log(`[Partner Service] Updated last_used_at for key: ${keyId}`);
}

/**
 * Update partner request count
 */
export async function incrementPartnerRequests(partnerId: string): Promise<void> {
  // In production: Prisma increment
  console.log(`[Partner Service] Incremented requests for partner: ${partnerId}`);
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string): Promise<boolean> {
  // In production: Prisma update
  console.log(`[Partner Service] Revoked API key: ${keyId}`);
  return true;
}

/**
 * Get partner API keys
 */
export async function getPartnerApiKeys(partnerId: string): Promise<ApiKey[]> {
  // In production: Prisma findMany
  return [];
}

/**
 * Check if endpoint is allowed by scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope);
}

/**
 * Get rate limit quota based on tier
 */
export function getRateLimitByTier(tier: 'basic' | 'professional' | 'enterprise'): { quota: number; window: number } {
  switch (tier) {
    case 'enterprise':
      return { quota: 100000, window: 86400 }; // 100k/day
    case 'professional':
      return { quota: 10000, window: 86400 }; // 10k/day
    case 'basic':
    default:
      return { quota: 1000, window: 86400 }; // 1k/day
  }
}
