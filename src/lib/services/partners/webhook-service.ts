/**
 * =====================================================
 * PARTNER WEBHOOK SERVICE
 * AfterHoursID - Outbound Webhook Notifications
 * =====================================================
 */

import { createHmac } from 'crypto';

// Types
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  partnerId: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
}

export interface WebhookLog {
  id: string;
  partnerId: string;
  eventType: string;
  payload: object;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  responseStatus?: number;
  responseBody?: string;
  nextRetryAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

// Webhook events
export const WEBHOOK_EVENTS = {
  PROMO_CREATED: 'promo.created',
  PROMO_UPDATED: 'promo.updated',
  PROMO_EXPIRED: 'promo.expired',
  PROMO_DELETED: 'promo.deleted',
  VENUE_CREATED: 'venue.created',
  VENUE_UPDATED: 'venue.updated',
  VENUE_CLOSED: 'venue.closed',
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
} as const;

// Pending webhooks queue (use Redis in production)
const pendingWebhooks: Map<string, WebhookLog> = new Map();

/**
 * Generate webhook signature
 */
export function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateSignature(payload, secret);
  return signature === expected;
}

/**
 * Create webhook payload
 */
export function createWebhookPayload(
  event: string,
  data: Record<string, unknown>,
  partnerId: string
): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    partnerId,
  };
}

/**
 * Send webhook to partner
 */
export async function sendWebhook(
  config: WebhookConfig,
  event: string,
  data: Record<string, unknown>,
  partnerId: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payload = createWebhookPayload(event, data, partnerId);
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, config.secret);

  // Log the webhook attempt
  const webhookLog: WebhookLog = {
    id: crypto.randomUUID(),
    partnerId,
    eventType: event,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  };

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AfterHours-Signature': signature,
        'X-AfterHours-Event': event,
        'X-AfterHours-Timestamp': payload.timestamp,
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    webhookLog.attempts++;
    webhookLog.responseStatus = response.status;
    webhookLog.responseBody = await response.text();

    if (response.ok) {
      webhookLog.status = 'sent';
      webhookLog.sentAt = new Date();
      console.log(`[Webhook] Sent ${event} to partner ${partnerId}: ${response.status}`);
    } else {
      webhookLog.status = 'failed';
      console.error(`[Webhook] Failed ${event} to partner ${partnerId}: ${response.status}`);
    }

    // Store log (in production, save to database)
    pendingWebhooks.set(webhookLog.id, webhookLog);

    return { success: response.ok, statusCode: response.status };

  } catch (error) {
    webhookLog.attempts++;
    webhookLog.status = 'retrying';
    webhookLog.nextRetryAt = new Date(Date.now() + 60000); // Retry in 1 minute
    webhookLog.responseBody = error instanceof Error ? error.message : 'Unknown error';

    pendingWebhooks.set(webhookLog.id, webhookLog);

    console.error(`[Webhook] Error sending ${event} to partner ${partnerId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Trigger webhook for promo event
 */
export async function triggerPromoWebhook(
  event: typeof WEBHOOK_EVENTS.PROMO_CREATED | typeof WEBHOOK_EVENTS.PROMO_UPDATED | typeof WEBHOOK_EVENTS.PROMO_EXPIRED | typeof WEBHOOK_EVENTS.PROMO_DELETED,
  promo: {
    id: string;
    title: string;
    venue_id: string;
    venue_name?: string;
    category: string;
    status: string;
    valid_from?: string;
    valid_until?: string;
  },
  partnerConfig: WebhookConfig
): Promise<void> {
  if (!partnerConfig.events.includes(event)) {
    console.log(`[Webhook] Partner not subscribed to ${event}, skipping`);
    return;
  }

  await sendWebhook(partnerConfig, event, {
    promo: {
      id: promo.id,
      title: promo.title,
      venue_id: promo.venue_id,
      venue_name: promo.venue_name,
      category: promo.category,
      status: promo.status,
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
    },
  }, partnerConfig.url);
}

/**
 * Trigger webhook for venue event
 */
export async function triggerVenueWebhook(
  event: typeof WEBHOOK_EVENTS.VENUE_CREATED | typeof WEBHOOK_EVENTS.VENUE_UPDATED | typeof WEBHOOK_EVENTS.VENUE_CLOSED,
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string;
    status: string;
  },
  partnerConfig: WebhookConfig
): Promise<void> {
  if (!partnerConfig.events.includes(event)) {
    return;
  }

  await sendWebhook(partnerConfig, event, {
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      city: venue.city,
      status: venue.status,
    },
  }, partnerConfig.url);
}

/**
 * Retry failed webhooks (called by cron job)
 */
export async function retryFailedWebhooks(): Promise<void> {
  const now = new Date();
  
  for (const [id, log] of pendingWebhooks.entries()) {
    if (log.status === 'retrying' && log.nextRetryAt && log.nextRetryAt <= now) {
      if (log.attempts >= 3) {
        log.status = 'failed';
        console.log(`[Webhook] Max retries reached for webhook ${id}`);
        continue;
      }

      // In production, would re-send the webhook
      console.log(`[Webhook] Retrying webhook ${id}, attempt ${log.attempts}`);
    }
  }
}

/**
 * Get webhook logs for a partner
 */
export async function getWebhookLogs(
  partnerId: string,
  limit: number = 50
): Promise<WebhookLog[]> {
  const logs: WebhookLog[] = [];
  
  for (const [_, log] of pendingWebhooks.entries()) {
    if (log.partnerId === partnerId) {
      logs.push(log);
    }
  }
  
  return logs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
