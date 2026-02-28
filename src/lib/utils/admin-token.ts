import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ONETIME_TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a secure one-time token for admin access
 */
export async function generateOneTimeToken(adminUserId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ONETIME_TOKEN_EXPIRY_HOURS);

  // Store token in database
  await supabase.from('admin_one_time_tokens').upsert({
    token,
    user_id: adminUserId,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_at: new Date().toISOString()
  }, {
    onConflict: 'token'
  });

  return token;
}

/**
 * Validate a one-time token and return the user ID if valid
 */
export async function validateOneTimeToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const { data, error } = await supabase
    .from('admin_one_time_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id };
}

/**
 * Mark a token as used
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  await supabase
    .from('admin_one_time_tokens')
    .update({ used: true })
    .eq('token', token);
}

/**
 * Generate dynamic admin dashboard link with one-time token
 */
export async function generateAdminDashboardLink(): Promise<string> {
  // Get the CEO/super admin user ID
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'SUPER_ADMIN')
    .limit(1)
    .single();

  if (!admin) {
    throw new Error('No SUPER_ADMIN found');
  }

  const token = await generateOneTimeToken(admin.id);
  
  // Return dynamic link with token
  return `https://nightlife.id/dashboard/super-admin/transparency?token=${token}`;
}
