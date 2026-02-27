/**
 * THE ETERNAL VIBE
 * Phase 10: The Global Vibe Protocol & Metaverse
 * 
 * Features:
 * - Decentralized archive on IPFS/Arweave
 * - Immutable nightlight memories
 * - Proof of attendance NFTs
 * - Historical data preservation
 */

import { createClient } from '@supabase/supabase-js';

// Archive types
export type ArchiveType = 
  | 'night_memory'
  | 'proof_of_attendance'
  | 'venue_history'
  | 'event_archive'
  | 'milestone';

// Storage provider
export type StorageProvider = 'ipfs' | 'arweave';

// Archive record
export interface EternalArchive {
  id: string;
  type: ArchiveType;
  userId: string;
  venueId?: string;
  eventId?: string;
  title: string;
  description: string;
  media: {
    type: 'image' | 'video' | 'audio' | '3d_model';
    cid: string; // IPFS/Arweave CID
    provider: StorageProvider;
  }[];
  metadata: Record<string, any>;
  timestamp: number;
  permanent: boolean; // Once true, cannot be deleted
  views: number;
  likes: number;
}

// Archive configuration
export const ARCHIVE_CONFIG = {
  // Storage providers
  providers: {
    ipfs: {
      apiUrl: process.env.IPFS_API_URL || 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      gateway: 'https://gateway.pinata.cloud/ipfs/',
    },
    arweave: {
      apiUrl: process.env.ARWEAVE_API_URL || 'https://arweave.net/graphql',
      gateway: 'https://arweave.net/',
    },
  },
  // Retention settings
  retention: {
    free: 365, // 1 year for free tier
    premium: -1, // Permanent for premium
    eternal: -1, // Forever - cannot be deleted
  },
  // File size limits (MB)
  limits: {
    image: 10,
    video: 100,
    audio: 50,
    model3d: 50,
  },
};

/**
 * Upload content to IPFS
 */
export async function uploadToIPFS(
  content: Record<string, any>
): Promise<{ cid: string; url: string }> {
  const response = await fetch(ARCHIVE_CONFIG.providers.ipfs.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': process.env.PINATA_API_KEY || '',
      'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || '',
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: {
        name: `vibe-archive-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  const data = await response.json();
  const cid = data.IpfsHash;
  
  return {
    cid,
    url: `${ARCHIVE_CONFIG.providers.ipfs.gateway}${cid}`,
  };
}

/**
 * Upload content to Arweave
 */
export async function uploadToArweave(
  content: Record<string, any>
): Promise<{ transactionId: string; url: string }> {
  // Simplified Arweave upload
  // In production, would use arweave-js library
  const response = await fetch(ARCHIVE_CONFIG.providers.arweave.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation CreateRecord($data: JSON!) {
          createRecord(data: $data) {
            id
          }
        }
      `,
      variables: {
        data: content,
      },
    }),
  });

  // For now, simulate with IPFS as fallback
  const ipfsResult = await uploadToIPFS(content);
  
  return {
    transactionId: ipfsResult.cid,
    url: ipfsResult.url,
  };
}

/**
 * Create eternal archive memory
 */
export async function createArchive(
  userId: string,
  type: ArchiveType,
  title: string,
  description: string,
  media: EternalArchive['media'],
  metadata: Record<string, any> = {},
  venueId?: string,
  eventId?: string
): Promise<EternalArchive> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Upload media to decentralized storage
  const uploadedMedia = await Promise.all(
    media.map(async (m) => {
      const result = await uploadToIPFS(m);
      return {
        ...m,
        cid: result.cid,
        url: result.url,
      };
    })
  );

  const archive: EternalArchive = {
    id: `archive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    userId,
    venueId,
    eventId,
    title,
    description,
    media: uploadedMedia,
    metadata,
    timestamp: Date.now(),
    permanent: type === 'proof_of_attendance' || type === 'milestone',
    views: 0,
    likes: 0,
  };

  // Store in database
  await supabase
    .from('eternal_archives')
    .insert({
      id: archive.id,
      user_id: userId,
      type,
      venue_id: venueId,
      event_id: eventId,
      title,
      description,
      media: JSON.stringify(archive.media),
      metadata: JSON.stringify(metadata),
      timestamp: archive.timestamp,
      permanent: archive.permanent,
      views: 0,
      likes: 0,
    });

  return archive;
}

/**
 * Get user's archive memories
 */
export async function getUserArchives(
  userId: string,
  type?: ArchiveType
): Promise<EternalArchive[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  let query = supabase
    .from('eternal_archives')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching archives:', error);
    return [];
  }

  return (data || []).map((archive) => ({
    id: archive.id,
    type: archive.type,
    userId: archive.user_id,
    venueId: archive.venue_id,
    eventId: archive.event_id,
    title: archive.title,
    description: archive.description,
    media: typeof archive.media === 'string' ? JSON.parse(archive.media) : archive.media,
    metadata: typeof archive.metadata === 'string' ? JSON.parse(archive.metadata) : archive.metadata,
    timestamp: archive.timestamp,
    permanent: archive.permanent,
    views: archive.views,
    likes: archive.likes,
  }));
}

/**
 * Create Proof of Attendance NFT
 */
export async function createProofOfAttendance(
  userId: string,
  venueId: string,
  eventId: string,
  checkinTime: number
): Promise<EternalArchive> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get venue details
  const { data: venue } = await supabase
    .from('venues')
    .select('name, location')
    .eq('id', venueId)
    .single();

  const poaData = {
    type: 'proof_of_attendance',
    userId,
    venueId,
    venueName: venue?.name || 'Unknown Venue',
    eventId,
    checkinTime,
    verified: true,
    signature: `signed-${Date.now()}`, // Would be cryptographic signature
  };

  return createArchive(
    userId,
    'proof_of_attendance',
    `Attended ${venue?.name || 'Event'}`,
    'Proof of attendance at this unforgettable night',
    [],
    poaData,
    venueId,
    eventId
  );
}

/**
 * Like/archive interaction
 */
export async function likeArchive(
  archiveId: string,
  userId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Record the like
  await supabase
    .from('archive_likes')
    .insert({
      archive_id: archiveId,
      user_id: userId,
      created_at: Date.now(),
    });

  // Update count
  const { data: current } = await supabase
    .from('eternal_archives')
    .select('likes')
    .eq('id', archiveId)
    .single();
  
  await supabase
    .from('eternal_archives')
    .update({ likes: (current?.likes || 0) + 1 })
    .eq('id', archiveId);
}

/**
 * Get archive analytics
 */
export interface ArchiveAnalytics {
  totalArchives: number;
  byType: Record<ArchiveType, number>;
  totalStorage: number; // in MB
  mostViewed: { title: string; views: number }[];
}

export async function getArchiveAnalytics(): Promise<ArchiveAnalytics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const { data: archives } = await supabase
    .from('eternal_archives')
    .select('*');

  const byType: Record<ArchiveType, number> = {
    night_memory: 0,
    proof_of_attendance: 0,
    venue_history: 0,
    event_archive: 0,
    milestone: 0,
  };

  archives?.forEach((a) => {
    if (byType[a.type as ArchiveType] !== undefined) {
      byType[a.type as ArchiveType]++;
    }
  });

  const mostViewed = (archives || [])
    .map((a) => ({ title: a.title, views: a.views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalArchives: archives?.length || 0,
    byType,
    totalStorage: 0, // Would calculate from media sizes
    mostViewed,
  };
}
