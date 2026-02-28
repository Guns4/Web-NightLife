/**
 * =====================================================
 * ADS TRACKER SERVICE
 * Click & Impression tracking with time-series analytics
 * =====================================================
 */

import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'nightlife_promos';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get MongoDB client (singleton)
 */
async function getClient(): Promise<MongoClient> {
  if (!client) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    await client.connect();
  }
  return client;
}

/**
 * Get database instance
 */
async function getDb(): Promise<Db> {
  if (!db) {
    const mongoClient = await getClient();
    db = mongoClient.db(MONGODB_DB);
  }
  return db;
}

// =====================================================
// AD TYPES
// =====================================================

export type AdEventType = 'impression' | 'click' | 'claim';

export type AdTier = 'homepage_banner' | 'top_search' | 'featured_card';

export interface AdEvent {
  _id?: any;
  
  // Event identification
  eventType: AdEventType;
  timestamp: Date;
  
  // Ad identification
  adId: string;
  venueId: string;
  adTier: AdTier;
  
  // Location context
  city?: string;
  userId?: string;
  sessionId?: string;
  
  // Device context
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  userAgent?: string;
  
  // Location context
  latitude?: number;
  longitude?: number;
}

// =====================================================
// AGGREGATED METRICS
// =====================================================

export interface AdMetrics {
  adId: string;
  venueId: string;
  adTier: AdTier;
  
  // Counters
  impressions: number;
  clicks: number;
  claims: number;
  
  // Rates
  ctr: number; // Click-through rate
  conversionRate: number;
  
  // Time windows
  lastUpdated: Date;
}

// =====================================================
// TRACKER SERVICE
// =====================================================

export class AdsTrackerService {
  private eventsCollection: Collection<AdEvent> | null = null;
  private metricsCollection: Collection<AdMetrics> | null = null;

  private async getEventsCollection(): Promise<Collection<AdEvent>> {
    if (!this.eventsCollection) {
      const database = await getDb();
      this.eventsCollection = database.collection<AdEvent>('ad_events');
      
      // Create time-series indexes for efficient queries
      await this.eventsCollection.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days retention
      );
      await this.eventsCollection.createIndex({ adId: 1, timestamp: -1 });
      await this.eventsCollection.createIndex({ venueId: 1, timestamp: -1 });
      await this.eventsCollection.createIndex({ eventType: 1, timestamp: -1 });
    }
    return this.eventsCollection;
  }

  private async getMetricsCollection(): Promise<Collection<AdMetrics>> {
    if (!this.metricsCollection) {
      const database = await getDb();
      this.metricsCollection = database.collection<AdMetrics>('ad_metrics');
      await this.metricsCollection.createIndex({ adId: 1 }, { unique: true });
      await this.metricsCollection.createIndex({ venueId: 1 });
      await this.metricsCollection.createIndex({ adTier: 1 });
    }
    return this.metricsCollection;
  }

  /**
   * Track an ad event (impression, click, claim)
   */
  async trackEvent(event: Omit<AdEvent, '_id' | 'timestamp'>): Promise<void> {
    const collection = await this.getEventsCollection();
    
    const adEvent: AdEvent = {
      ...event,
      timestamp: new Date(),
    };
    
    // Insert event (high-volume write, fire-and-forget)
    await collection.insertOne(adEvent);
    
    // Update aggregated metrics (async, don't await)
    this.updateMetrics(event.adId, event.eventType).catch(console.error);
  }

  /**
   * Track impression (convenience method)
   */
  async trackImpression(
    adId: string,
    venueId: string,
    adTier: AdTier,
    options?: {
      city?: string;
      userId?: string;
      sessionId?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
      userAgent?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'impression',
      adId,
      venueId,
      adTier,
      ...options,
    });
  }

  /**
   * Track click (convenience method)
   */
  async trackClick(
    adId: string,
    venueId: string,
    adTier: AdTier,
    options?: {
      city?: string;
      userId?: string;
      sessionId?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
      userAgent?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'click',
      adId,
      venueId,
      adTier,
      ...options,
    });
  }

  /**
   * Track claim (convenience method)
   */
  async trackClaim(
    adId: string,
    venueId: string,
    adTier: AdTier,
    userId: string,
    options?: {
      city?: string;
      sessionId?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
    }
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'claim',
      adId,
      venueId,
      adTier,
      userId,
      ...options,
    });
  }

  /**
   * Update aggregated metrics (internal)
   */
  private async updateMetrics(adId: string, eventType: AdEventType): Promise<void> {
    const metricsCollection = await this.getMetricsCollection();
    
    // Get event counts for the last 24 hours
    const eventsCollection = await this.getEventsCollection();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pipeline = [
      {
        $match: {
          adId,
          timestamp: { $gte: yesterday },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ];
    
    const results = await eventsCollection.aggregate(pipeline).toArray();
    
    const counts = {
      impressions: 0,
      clicks: 0,
      claims: 0,
    };
    
    results.forEach((r: any) => {
      if (r._id === 'impression') counts.impressions = r.count;
      if (r._id === 'click') counts.clicks = r.count;
      if (r._id === 'claim') counts.claims = r.count;
    });
    
    const ctr = counts.impressions > 0 ? (counts.clicks / counts.impressions) * 100 : 0;
    const conversionRate = counts.clicks > 0 ? (counts.claims / counts.clicks) * 100 : 0;
    
    // Upsert metrics
    await metricsCollection.updateOne(
      { adId },
      {
        $set: {
          impressions: counts.impressions,
          clicks: counts.clicks,
          claims: counts.claims,
          ctr: Math.round(ctr * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );
  }

  /**
   * Get metrics for a specific ad
   */
  async getAdMetrics(adId: string): Promise<AdMetrics | null> {
    const metricsCollection = await this.getMetricsCollection();
    return metricsCollection.findOne({ adId });
  }

  /**
   * Get metrics for a venue's ads
   */
  async getVenueMetrics(venueId: string): Promise<AdMetrics[]> {
    const metricsCollection = await this.getMetricsCollection();
    return metricsCollection.find({ venueId }).toArray();
  }

  /**
   * Get trending ads (highest CTR)
   */
  async getTrendingAds(options?: {
    limit?: number;
    adTier?: AdTier;
    city?: string;
  }): Promise<AdMetrics[]> {
    const metricsCollection = await this.getMetricsCollection();
    
    const query: any = {};
    if (options?.adTier) {
      query.adTier = options.adTier;
    }
    
    return metricsCollection
      .find(query)
      .sort({ ctr: -1 })
      .limit(options?.limit || 10)
      .toArray();
  }

  /**
   * Get ad performance over time
   */
  async getAdPerformanceOverTime(
    adId: string,
    days: number = 7
  ): Promise<{ date: string; impressions: number; clicks: number; claims: number }[]> {
    const eventsCollection = await this.getEventsCollection();
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const pipeline = [
      {
        $match: {
          adId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          impressions: {
            $sum: { $cond: [{ $eq: ['$eventType', 'impression'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          claims: {
            $sum: { $cond: [{ $eq: ['$eventType', 'claim'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];
    
    const results = await eventsCollection.aggregate(pipeline).toArray();
    
    return results.map((r: any) => ({
      date: r._id,
      impressions: r.impressions,
      clicks: r.clicks,
      claims: r.claims,
    }));
  }
}

// Export singleton
export const adsTrackerService = new AdsTrackerService();
