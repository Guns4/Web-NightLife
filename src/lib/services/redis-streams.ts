/**
 * =====================================================
 * REAL-TIME EVENT ANALYTICS WITH REDIS STREAMS
 * AfterHoursID - High-Frequency Event Capture
 * =====================================================
 */

import Redis from 'ioredis';

// Types
export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  venueId?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  correlationId?: string;
}

export interface StreamConsumer {
  id: string;
  group: string;
  stream: string;
  lastReadId: string;
}

// Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Stream configuration
const STREAMS = {
  venueViews: 'analytics:venue:views',
  searchKeywords: 'analytics:search:keywords',
  userActions: 'analytics:user:actions',
  payments: 'analytics:payments',
  bookings: 'analytics:bookings',
};

// Consumer groups
const CONSUMER_GROUPS = {
  analytics: 'analytics-processors',
  reporting: 'reporting-service',
  ml: 'ml-pipeline',
};

class RedisStreamAnalytics {
  /**
   * Initialize streams and consumer groups
   */
  async initialize(): Promise<void> {
    // Create consumer groups for each stream
    for (const stream of Object.values(STREAMS)) {
      try {
        await redis.xgroup('CREATE', stream, CONSUMER_GROUPS.analytics, '0', 'MKSTREAM');
        console.log(`[Redis Streams] Created group for ${stream}`);
      } catch (error: unknown) {
        // Group already exists is OK
        if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
          console.error(`[Redis Streams] Error creating group for ${stream}:`, error);
        }
      }
    }
  }

  /**
   * Capture venue view event
   */
  async captureVenueView(
    venueId: string,
    userId: string | null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      eventType: 'venue_view',
      venueId,
      userId: userId || undefined,
      metadata: {
        ...metadata,
        referrer: metadata.referrer || 'direct',
        device: metadata.device || 'web',
      },
      timestamp: new Date().toISOString(),
    };

    await this.pushToStream(STREAMS.venueViews, event);
  }

  /**
   * Capture search event
   */
  async captureSearch(userId: string | null, keyword: string, filters: Record<string, unknown> = {}): Promise<void> {
    const event: AnalyticsEvent = {
      eventType: 'search',
      userId: userId || undefined,
      metadata: {
        keyword: keyword.toLowerCase().trim(),
        filters,
        resultsCount: filters.resultsCount || 0,
      },
      timestamp: new Date().toISOString(),
    };

    await this.pushToStream(STREAMS.searchKeywords, event);
  }

  /**
   * Capture user action (click, favorite, share)
   */
  async captureUserAction(
    userId: string,
    action: string,
    targetType: 'venue' | 'event' | 'promo' | 'user',
    targetId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      eventType: 'user_action',
      userId,
      metadata: {
        action,
        targetType,
        targetId,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    };

    await this.pushToStream(STREAMS.userActions, event);
  }

  /**
   * Push event to stream
   */
  private async pushToStream(stream: string, event: AnalyticsEvent): Promise<string> {
    const fields = [
      'eventType', event.eventType,
      'timestamp', event.timestamp,
    ];

    if (event.userId) {
      fields.push('userId', event.userId);
    }
    if (event.venueId) {
      fields.push('venueId', event.venueId);
    }
    fields.push('metadata', JSON.stringify(event.metadata));

    const messageId = await redis.xadd(stream, '*', ...fields);
    
    if (!messageId) {
      console.error(`[Redis Streams] Failed to push to ${stream}`);
      return '';
    }
    
    // Also increment daily counter for quick stats
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`stats:daily:${today}`, event.eventType, 1);

    console.log(`[Redis Streams] Captured ${event.eventType} to ${stream}:`, messageId);
    return messageId;
  }

  /**
   * Read from stream (consumer group)
   */
  async readFromStream(
    stream: string,
    consumerId: string,
    count: number = 10,
    blockMs: number = 5000
  ): Promise<Array<{ id: string; data: AnalyticsEvent }>> {
    const results = await redis.xreadgroup(
      'GROUP', CONSUMER_GROUPS.analytics, consumerId,
      'COUNT', count,
      'BLOCK', blockMs,
      'STREAMS', stream, '>'
    ) as Array<[string, Array<[string, string[]]>]> | null;

    if (!results) return [];

    const events: Array<{ id: string; data: AnalyticsEvent }> = [];

    for (const [, messages] of results) {
      for (const [id, fields] of messages) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }

        events.push({
          id,
          data: {
            eventType: data.eventType,
            userId: data.userId,
            venueId: data.venueId,
            metadata: JSON.parse(data.metadata || '{}'),
            timestamp: data.timestamp,
          },
        });
      }
    }

    return events;
  }

  /**
   * Acknowledge processed messages
   */
  async acknowledge(stream: string, consumerId: string, messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    await redis.xack(stream, CONSUMER_GROUPS.analytics, ...messageIds);
  }

  /**
   * Get real-time stats for today
   */
  async getTodayStats(): Promise<Record<string, number>> {
    const today = new Date().toISOString().split('T')[0];
    const stats = await redis.hgetall(`stats:daily:${today}`);
    
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(stats)) {
      result[key] = parseInt(value, 10) || 0;
    }
    
    return result;
  }

  /**
   * Get trending venues (most views in last N minutes)
   */
  async getTrendingVenues(minutes: number = 60, limit: number = 10): Promise<Array<{ venueId: string; views: number }>> {
    const cutoff = Date.now() - minutes * 60 * 1000;
    
    // Use Redis sorted set for real-time ranking
    const trending = await redis.zrevrange(`trending:venues:${minutes}m`, 0, limit - 1, 'WITHSCORES');
    
    const results: Array<{ venueId: string; views: number }> = [];
    for (let i = 0; i < trending.length; i += 2) {
      results.push({
        venueId: trending[i],
        views: parseInt(trending[i + 1], 10) || 0,
      });
    }
    
    return results;
  }

  /**
   * Update trending venues (call periodically)
   */
  async updateTrendingVenues(windowMinutes: number = 60): Promise<void> {
    const windowMs = windowMinutes * 60 * 1000;
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const key = `trending:venues:${windowMinutes}m`;

    // Get all venue views in the window
    const events = await redis.xread(
      'COUNT', 1000,
      'STREAMS', STREAMS.venueViews, '0'
    );

    if (!events) return;

    const venueCounts = new Map<string, number>();

    for (const [, messages] of events) {
      for (const [, fields] of messages) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }

        if (data.venueId && data.timestamp && data.timestamp >= cutoff) {
          venueCounts.set(
            data.venueId,
            (venueCounts.get(data.venueId) || 0) + 1
          );
        }
      }
    }

    // Update sorted set
    const pipeline = redis.pipeline();
    
    for (const [venueId, count] of venueCounts) {
      pipeline.zadd(key, count, venueId);
    }
    
    // Set expiry (window + buffer)
    pipeline.expire(key, windowMinutes * 60 + 60);
    
    await pipeline.exec();
  }

  /**
   * Get popular search keywords
   */
  async getPopularKeywords(limit: number = 20): Promise<Array<{ keyword: string; count: number }>> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all search events from today
    const results = await redis.xread(
      'COUNT', 10000,
      'STREAMS', STREAMS.searchKeywords, '0'
    );

    if (!results) return [];

    const keywordCounts = new Map<string, number>();

    for (const [, messages] of results) {
      for (const [, fields] of messages) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }

        const metadata = JSON.parse(data.metadata || '{}');
        if (metadata.keyword) {
          keywordCounts.set(
            metadata.keyword,
            (keywordCounts.get(metadata.keyword) || 0) + 1
          );
        }
      }
    }

    // Sort by count and return top N
    const sorted = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([keyword, count]) => ({ keyword, count }));
  }

  /**
   * Cleanup old stream data
   */
  async cleanup(maxAgeDays: number = 7): Promise<void> {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const minId = Date.now() - maxAgeMs;

    for (const stream of Object.values(STREAMS)) {
      try {
        await redis.xtrim(stream, 'MINID', minId, 'LIMIT', 1000);
        console.log(`[Redis Streams] Trimmed ${stream}`);
      } catch (error) {
        console.error(`[Redis Streams] Error trimming ${stream}:`, error);
      }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await redis.quit();
  }
}

// Export singleton
export const redisStreams = new RedisStreamAnalytics();
