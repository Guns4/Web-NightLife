'use server';

/**
 * WALLET ACTIONS - PHASE 4.3
 * Digital Membership Card (Apple Wallet & Google Wallet)
 * 
 * Features:
 * - Generate .pkpass for Apple Wallet
 * - Generate Save to Google Pay link
 * - Dynamic QR code with TOTP
 * - Pass refresh on tier upgrade
 * - Scan verification for venues
 */

import { revalidatePath } from 'next/cache';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface MembershipCard {
  id: string;
  user_id: string;
  card_serial_number: string;
  member_id: string;
  qr_dynamic_token: string | null;
  qr_secret_key: string;
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  privileges: any[];
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  tier: string;
  xp_total: number;
  level: number;
}

interface TierConfig {
  name: string;
  color: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

const TIER_CONFIG: Record<string, TierConfig> = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    backgroundColor: '#CD7F32',
    textColor: '#FFFFFF',
    icon: '🥉'
  },
  silver: {
    name: 'Silver',
    color: '#C0C0C0',
    backgroundColor: '#C0C0C0',
    textColor: '#000000',
    icon: '🥈'
  },
  gold: {
    name: 'Gold',
    color: '#FFD700',
    backgroundColor: '#FFD700',
    textColor: '#000000',
    icon: '🥇'
  },
  platinum: {
    name: 'Platinum',
    color: '#E5E4E2',
    backgroundColor: '#E5E4E2',
    textColor: '#000000',
    icon: '💎'
  }
};

// Helper functions
function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

function getSupabaseAdmin(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get user's membership card
 */
export async function getMembershipCard(userId: string): Promise<MembershipCard | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('membership_cards')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  
  return data as MembershipCard;
}

/**
 * Get user's profile with tier info
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, avatar_url, tier, xp_total, level')
    .eq('id', userId)
    .single();
  
  if (error || !data) return null;
  
  return data as UserProfile;
}

/**
 * Generate dynamic QR token for membership card
 * Uses TOTP algorithm for security
 */
export async function generateDynamicQRToken(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  
  // Get user's card secret
  const { data: card } = await supabase
    .from('membership_cards')
    .select('qr_secret_key')
    .eq('user_id', userId)
    .single();
  
  if (!card) return null;
  
  // Generate TOTP
  const period = 30;
  const timestamp = Math.floor(Date.now() / 1000 / period);
  const secret = card.qr_secret_key;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const token = hashHex.slice(-8).toUpperCase();
  
  // Update card with new token
  await supabase
    .from('membership_cards')
    .update({
      qr_dynamic_token: token,
      qr_generated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  return token;
}

/**
 * Verify membership card QR token
 */
export async function verifyMembershipQR(
  token: string,
  venueId?: string
): Promise<{
  valid: boolean;
  member?: {
    id: string;
    name: string;
    memberId: string;
    tier: string;
    privileges: any[];
  };
  message: string;
}> {
  const supabase = getSupabaseAdmin();
  
  // Find card by token
  const { data: card, error } = await supabase
    .from('membership_cards')
    .select(`
      id,
      user_id,
      member_id,
      current_tier,
      privileges,
      is_valid,
      qr_secret_key,
      user:user_profiles(full_name)
    `)
    .eq('qr_dynamic_token', token)
    .single();
  
  if (error || !card) {
    return { valid: false, message: 'Kartu tidak valid' };
  }
  
  if (!card.is_valid) {
    return { valid: false, message: 'Kartu telah dinonaktifkan' };
  }
  
  // Verify token is not expired (within 30 seconds)
  const { data: tokenCheck } = await supabase
    .from('membership_cards')
    .select('qr_generated_at')
    .eq('id', card.id)
    .single();
  
  if (tokenCheck?.qr_generated_at) {
    const generatedAt = new Date(tokenCheck.qr_generated_at).getTime();
    const now = Date.now();
    if (now - generatedAt > 35000) { // 35 second buffer
      return { valid: false, message: 'QR code sudah kedaluwarsa' };
    }
  }
  
  // Log scan if venue provided
  if (venueId) {
    await supabase.from('member_scans').insert({
      card_id: card.id,
      venue_id: venueId,
      scan_method: 'qr',
      scan_result: 'success',
      scanned_at: new Date().toISOString()
    });
  }
  
  return {
    valid: true,
    member: {
      id: card.user_id,
      name: (card as any).user?.full_name || 'Member',
      memberId: card.member_id,
      tier: card.current_tier,
      privileges: card.privileges
    },
    message: 'Verifikasi berhasil'
  };
}

/**
 * Generate Apple Wallet pass data
 * Note: Actual .pkpass generation requires apple-developer credentials
 * This creates the pass data structure
 */
export async function generateApplePassData(userId: string): Promise<{
  success: boolean;
  passData?: any;
  message: string;
}> {
  const supabase = getSupabase();
  
  const card = await getMembershipCard(userId);
  const profile = await getUserProfile(userId);
  
  if (!card || !profile) {
    return { success: false, message: 'Membership card not found' };
  }
  
  const tierConfig = TIER_CONFIG[card.current_tier];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nightlife.id';
  
  // Generate dynamic QR
  const qrToken = await generateDynamicQRToken(userId);
  
  // Apple Wallet pass structure
  const passData = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.nightlife.id.membership',
    serialNumber: card.card_serial_number,
    teamIdentifier: 'TEAM_ID',
    organizationName: 'NightLife Indonesia',
    description: `NightLife ${tierConfig.name} Member`,
    logoText: 'NightLife',
    foregroundColor: tierConfig.textColor,
    backgroundColor: tierConfig.backgroundColor,
    labelColor: tierConfig.textColor,
    
    // Barcode
    barcode: {
      message: `${card.member_id}:${qrToken}`,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1'
    },
    
    // Card visual
    boardingPass: {
      primaryFields: [
        {
          key: 'member',
          label: 'MEMBER',
          value: profile.full_name
        }
      ],
      secondaryFields: [
        {
          key: 'tier',
          label: 'TIER',
          value: `${tierConfig.icon} ${tierConfig.name.toUpperCase()}`
        },
        {
          key: 'memberId',
          label: 'MEMBER ID',
          value: card.member_id
        }
      ],
      auxiliaryFields: [
        {
          key: 'xp',
          label: 'XP',
          value: profile.xp_total.toLocaleString()
        },
        {
          key: 'level',
          label: 'LEVEL',
          value: `Lv.${profile.level}`
        }
      ],
      backFields: [
        {
          key: 'privileges',
          label: 'YOUR PRIVILEGES',
          value: (card.privileges || [])
            .map((p: any) => `• ${p.name}: ${p.description}`)
            .join('\n')
        }
      ]
    },
    
    // Web service for pass updates
    // In production, configure APNS web service
  };
  
  // In production, would generate actual .pkpass file using
  // node-pkpass library with Apple certificates
  
  return {
    success: true,
    passData,
    message: 'Pass data generated successfully'
  };
}

/**
 * Generate Google Wallet pass link
 */
export async function generateGooglePassLink(userId: string): Promise<{
  success: boolean;
  link?: string;
  message: string;
}> {
  const supabase = getSupabase();
  
  const card = await getMembershipCard(userId);
  const profile = await getUserProfile(userId);
  
  if (!card || !profile) {
    return { success: false, message: 'Membership card not found' };
  }
  
  const tierConfig = TIER_CONFIG[card.current_tier];
  
  // Generate JWT for Google Pay
  const qrToken = await generateDynamicQRToken(userId);
  
  // In production, this would use Google Pay API to create a generic pass
  // For now, generate a deep link structure
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nightlife.id';
  const payload = {
    iss: process.env.GOOGLE_SERVICE_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    payload: {
      genericClasses: [{
        id: `CLASS_${card.current_tier}`,
        classTemplateInfo: {
          cardTemplateOverride: {
            cardRowTemplate: [
              {
                twoItems: {
                  leftItem: {
                    firstValue: {
                      fields: [{ key: 'memberName', value: profile.full_name }]
                    }
                  },
                  rightItem: {
                    firstValue: {
                      fields: [{ key: 'tier', value: tierConfig.name }]
                    }
                  }
                }
              }
            ]
          }
        }
      }],
      genericObjects: [{
        id: `OBJECT_${card.id}`,
        classId: `CLASS_${card.current_tier}`,
        objectId: `OBJECT_${card.id}`,
        state: 'active',
        barcode: {
          type: 'QR_CODE',
          value: `${card.member_id}:${qrToken}`
        },
        linksModuleData: {
          uris: [
            {
              uri: `${baseUrl}/card/${card.id}`,
              description: 'View Card Details'
            }
          ]
        }
      }]
    }
  };
  
  // Generate save link (in production, sign with Google service account)
  const saveLink = `https://pay.google.com/gp/p/save/${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  
  return {
    success: true,
    link: saveLink,
    message: 'Google Pass link generated'
  };
}

/**
 * Refresh pass data after tier upgrade
 */
export async function refreshPassData(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = getSupabase();
  
  // Get updated profile
  const profile = await getUserProfile(userId);
  if (!profile) {
    return { success: false, message: 'User not found' };
  }
  
  // Generate new tokens
  await generateDynamicQRToken(userId);
  
  // Update sync status
  await supabase
    .from('membership_cards')
    .update({
      is_synced: false,
      last_synced: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  // Create notification
  await supabase.from('pass_notifications').insert({
    user_id: userId,
    notification_type: 'tier_upgrade',
    title: 'Kartu Membership Diperbarui!',
    body: `Selamat! Kartu ${profile.tier} Anda telah diperbarui. Tambahkan ke wallet untuk akses penuh.`,
    created_at: new Date().toISOString()
  });
  
  return {
    success: true,
    message: 'Pass data refreshed successfully'
  };
}

/**
 * Record a membership card scan
 */
export async function recordMemberScan(
  cardId: string,
  scannedByStaffId: string,
  venueId: string,
  stationId: string,
  scanMethod: 'qr' | 'nfc' | 'manual',
  scanResult: 'success' | 'expired' | 'invalid' | 'tier_mismatch'
) {
  const supabase = getSupabaseAdmin();
  
  const { data: scan, error } = await supabase
    .from('member_scans')
    .insert({
      card_id: cardId,
      scanned_by_staff_id: scannedByStaffId,
      venue_id: venueId,
      station_id: stationId,
      scan_method: scanMethod,
      scan_result: scanResult,
      scanned_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // If successful scan, notify card owner
  if (scanResult === 'success') {
    const { data: card } = await supabase
      .from('membership_cards')
      .select('user_id')
      .eq('id', cardId)
      .single();
    
    if (card) {
      await supabase.from('pass_notifications').insert({
        user_id: card.user_id,
        card_id: cardId,
        notification_type: 'scanned',
        title: 'Kartu Dipindai',
        body: 'Kartu membership Anda telah dipindai di venue',
        created_at: new Date().toISOString()
      });
    }
  }
  
  return { data: scan, error };
}

/**
 * Get scan history for a user
 */
export async function getMemberScanHistory(userId: string, limit: number = 10) {
  const supabase = getSupabase();
  
  const { data: card } = await supabase
    .from('membership_cards')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (!card) return { data: null, error: 'Card not found' };
  
  return await supabase
    .from('member_scans')
    .select(`
      id,
      scanned_at,
      scan_method,
      scan_result,
      venue:venues(name),
      station:venue_stations(name)
    `)
    .eq('card_id', card.id)
    .order('scanned_at', { ascending: false })
    .limit(limit);
}

/**
 * Get tier config for UI display
 */
export function getTierConfig(tier: string): TierConfig {
  return TIER_CONFIG[tier] || TIER_CONFIG.bronze;
}

/**
 * Get tier progression info
 */
export function getTierProgression(xp: number): {
  currentTier: string;
  nextTier: string | null;
  xpToNextTier: number;
  progress: number;
} {
  const tiers = [
    { name: 'bronze', minXp: 0 },
    { name: 'silver', minXp: 500 },
    { name: 'gold', minXp: 2000 },
    { name: 'platinum', minXp: 5000 }
  ];
  
  let currentTier = 'bronze';
  let nextTier: string | null = 'silver';
  let xpToNextTier = 500;
  
  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].minXp) {
      currentTier = tiers[i].name;
      nextTier = tiers[i + 1]?.name || null;
      xpToNextTier = nextTier ? (tiers[i + 1].minXp - xp) : 0;
    }
  }
  
  const currentTierMin = tiers.find(t => t.name === currentTier)?.minXp || 0;
  const nextTierMin = nextTier ? (tiers.find(t => t.name === nextTier)?.minXp || 0) : currentTierMin + 1000;
  const progress = nextTier 
    ? ((xp - currentTierMin) / (nextTierMin - currentTierMin)) * 100 
    : 100;
  
  return {
    currentTier,
    nextTier,
    xpToNextTier,
    progress: Math.min(100, Math.max(0, progress))
  };
}
