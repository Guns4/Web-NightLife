/**
 * =====================================================
 * RSVP & SOCIAL SERVICE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

export interface RSVP {
  id: string;
  venueId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  status: 'going' | 'interested' | 'not_going';
  expiresAt: string;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  venueId: string;
  venueName: string;
  deepLink: string;
  whatsappLink: string;
  shortUrl?: string;
  qrCode?: string;
}

// RSVP expiry time (12 hours)
const RSVP_EXPIRY_HOURS = 12;

// In-memory stores
const rsvps: Map<string, RSVP> = new Map();
const venueRsvps: Map<string, RSVP[]> = new Map();

/**
 * Toggle RSVP for a venue
 */
export async function toggleRSVP(
  venueId: string,
  userId: string,
  userName: string,
  userAvatar?: string,
  status: 'going' | 'interested' = 'going'
): Promise<{ success: boolean; rsvp?: RSVP; error?: string }> {
  try {
    // Check if user already has RSVP for this venue
    const existingKey = `${venueId}_${userId}`;
    const existingRsvp = rsvps.get(existingKey);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RSVP_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (existingRsvp) {
      // Toggle existing RSVP
      if (existingRsvp.status === status) {
        // Remove RSVP if same status
        rsvps.delete(existingKey);
        
        // Remove from venue list
        const venueList = venueRsvps.get(venueId) || [];
        venueRsvps.set(venueId, venueList.filter(r => r.userId !== userId));
        
        return { success: true };
      } else {
        // Update status
        existingRsvp.status = status;
        existingRsvp.expiresAt = expiresAt.toISOString();
        existingRsvp.createdAt = now.toISOString();
        rsvps.set(existingKey, existingRsvp);
        
        return { success: true, rsvp: existingRsvp };
      }
    }
    
    // Create new RSVP
    const rsvp: RSVP = {
      id: uuidv4(),
      venueId,
      userId,
      userName,
      userAvatar,
      status,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
    
    rsvps.set(existingKey, rsvp);
    
    // Add to venue list
    const venueList = venueRsvps.get(venueId) || [];
    venueList.push(rsvp);
    venueRsvps.set(venueId, venueList);
    
    return { success: true, rsvp };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get RSVP status for user
 */
export async function getUserRsvp(
  venueId: string,
  userId: string
): Promise<RSVP | null> {
  const key = `${venueId}_${userId}`;
  const rsvp = rsvps.get(key);
  
  // Check if expired
  if (rsvp && new Date(rsvp.expiresAt) < new Date()) {
    // Remove expired RSVP
    rsvps.delete(key);
    return null;
  }
  
  return rsvp || null;
}

/**
 * Get venue RSVPs (Who's Going)
 */
export async function getVenueRsvps(
  venueId: string,
  status?: 'going' | 'interested'
): Promise<RSVP[]> {
  let rsvpList = venueRsvps.get(venueId) || [];
  
  // Filter out expired RSVPs
  const now = new Date();
  rsvpList = rsvpList.filter(r => new Date(r.expiresAt) > now);
  
  if (status) {
    rsvpList = rsvpList.filter(r => r.status === status);
  }
  
  return rsvpList;
}

/**
 * Get venue going count
 */
export async function getGoingCount(venueId: string): Promise<number> {
  const rsvpList = await getVenueRsvps(venueId, 'going');
  return rsvpList.length;
}

/**
 * Clean up expired RSVPs
 */
export async function cleanupExpiredRsvps(): Promise<number> {
  const now = new Date();
  let count = 0;
  
  for (const [key, rsvp] of rsvps.entries()) {
    if (new Date(rsvp.expiresAt) < now) {
      rsvps.delete(key);
      count++;
    }
  }
  
  return count;
}

/**
 * Generate deep link for venue
 */
export function generateDeepLink(
  venueId: string,
  venueName: string,
  baseUrl: string = 'https://afterhours.id'
): ShareLink {
  const id = uuidv4();
  const slug = venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  
  const deepLink = `${baseUrl}/venue/${venueId}`;
  const whatsappText = `🔥 Check out ${venueName} on AfterHours!\n${deepLink}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  
  return {
    id,
    venueId,
    venueName,
    deepLink,
    whatsappLink,
    // In production, generate short URL with Bitly/Brandly
    shortUrl: deepLink,
    // QR code would be generated with a library
  };
}

/**
 * Get shareable link for venue
 */
export async function getVenueShareLink(
  venueId: string,
  venueName: string
): Promise<ShareLink> {
  return generateDeepLink(venueId, venueName);
}
