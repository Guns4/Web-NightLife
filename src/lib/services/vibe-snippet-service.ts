/**
 * =====================================================
 * VIBE SNIPPET SERVICE - EPHEMERAL CONTENT
 * AfterHoursID - Sovereign Shield & Global Expansion
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TYPES
// =====================================================

export interface VibeSnippet {
  id: string;
  venueId: string;
  userId: string;
  userName: string;
  userRole: 'verified_user' | 'staff' | 'vip';
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  aiModerationScore: number;
  views: number;
  likes: number;
  createdAt: string;
  expiresAt: string;
}

export interface VibeReport {
  id: string;
  snippetId: string;
  userId: string;
  reason: string;
  createdAt: string;
}

// =====================================================
// VIBE SNIPPET OPERATIONS
// =====================================================

const snippets: Map<string, VibeSnippet> = new Map();

/**
 * Create a new vibe snippet
 */
export async function createVibeSnippet(
  venueId: string,
  userId: string,
  userName: string,
  userRole: VibeSnippet['userRole'],
  videoUrl: string,
  thumbnailUrl: string,
  caption: string
): Promise<{ success: boolean; snippet?: VibeSnippet; error?: string }> {
  try {
    // Check if user is allowed (verified or staff)
    if (!['verified_user', 'staff', 'vip'].includes(userRole)) {
      return { success: false, error: 'Only verified users, VIPs, and staff can post' };
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
    
    const snippet: VibeSnippet = {
      id: uuidv4(),
      venueId,
      userId,
      userName,
      userRole,
      videoUrl,
      thumbnailUrl,
      caption,
      status: 'pending', // Requires AI moderation
      aiModerationScore: 0,
      views: 0,
      likes: 0,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    // Run AI moderation (simulated)
    const moderationResult = await moderateContent(caption, videoUrl);
    snippet.aiModerationScore = moderationResult.score;
    snippet.status = moderationResult.approved ? 'approved' : 'rejected';
    
    snippets.set(snippet.id, snippet);
    
    return { success: true, snippet };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get active vibe snippets for a venue
 */
export async function getVenueVibes(venueId: string): Promise<VibeSnippet[]> {
  const now = new Date();
  
  return Array.from(snippets.values())
    .filter(s => {
      const isVenue = s.venueId === venueId;
      const isActive = s.status === 'approved' && new Date(s.expiresAt) > now;
      return isVenue && isActive;
    })
    .sort((a, b) => b.views - a.views); // Most viewed first
}

/**
 * Record view
 */
export async function recordView(snippetId: string): Promise<void> {
  const snippet = snippets.get(snippetId);
  if (snippet) {
    snippet.views++;
    snippets.set(snippetId, snippet);
  }
}

/**
 * Record like
 */
export async function recordLike(snippetId: string): Promise<void> {
  const snippet = snippets.get(snippetId);
  if (snippet) {
    snippet.likes++;
    snippets.set(snippetId, snippet);
  }
}

/**
 * Report inappropriate content
 */
export async function reportSnippet(
  snippetId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean }> {
  const report: VibeReport = {
    id: uuidv4(),
    snippetId,
    userId,
    reason,
    createdAt: new Date().toISOString(),
  };
  
  // In production, store report and potentially remove snippet
  console.log('Vibe reported:', report);
  
  return { success: true };
}

/**
 * Clean up expired snippets
 */
export async function cleanupExpiredSnippets(): Promise<number> {
  const now = new Date();
  let count = 0;
  
  for (const [id, snippet] of snippets.entries()) {
    if (new Date(snippet.expiresAt) < now) {
      snippet.status = 'expired';
      snippets.set(id, snippet);
      count++;
    }
  }
  
  return count;
}

// =====================================================
// AI CONTENT MODERATION
// =====================================================

interface ModerationResult {
  approved: boolean;
  score: number;
  flags: string[];
}

/**
 * AI content moderation (simulated)
 * In production, integrate with Google Cloud Vision AI or AWS Rekognition
 */
async function moderateContent(caption: string, videoUrl: string): Promise<ModerationResult> {
  // Simulated AI moderation
  // In production: Call AI API to analyze content
  
  const inappropriateKeywords = [
    'violence', 'weapon', 'drug', 'nsfw', 'explicit',
    'hate', 'discrimination', 'scam', 'fraud'
  ];
  
  const captionLower = caption.toLowerCase();
  const flags: string[] = [];
  
  // Check for inappropriate content
  for (const keyword of inappropriateKeywords) {
    if (captionLower.includes(keyword)) {
      flags.push(`Inappropriate keyword: ${keyword}`);
    }
  }
  
  // Score: 0-1 (1 = fully appropriate)
  const score = flags.length === 0 ? 0.95 : Math.max(0, 0.95 - flags.length * 0.2);
  
  return {
    approved: score >= 0.7,
    score,
    flags,
  };
}

/**
 * Manual moderation override
 */
export async function moderateManually(
  snippetId: string,
  approved: boolean
): Promise<{ success: boolean }> {
  const snippet = snippets.get(snippetId);
  if (!snippet) {
    return { success: false };
  }
  
  snippet.status = approved ? 'approved' : 'rejected';
  snippets.set(snippetId, snippet);
  
  return { success: true };
}
