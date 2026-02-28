/**
 * WATI.io API Service Module
 * 
 * Provides functions to send WhatsApp messages via WATI.io API.
 * Used by Supabase Edge Functions for booking notifications.
 * 
 * @module lib/services/wati
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT || 'https://app-server.wati.io';
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;
const FAZZ_API_KEY = process.env.FAZZ_BUSINESS_API_KEY; // Placeholder for future

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * WATI API Response
 */
export interface WatiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Retryable error codes
 */
const RETRYABLE_CODES = [429, 500, 502, 503, 504];

/**
 * Maximum retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Retry delay in milliseconds
 */
const RETRY_DELAY_MS = 1000;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format phone number with country code
 * Ensures phone number is in format: +62xxx or +60xxx
 * 
 * @param phone - Raw phone number input
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    // Assume Indonesian if starts with 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
      cleaned = '62' + cleaned;
    } else if (cleaned.startsWith('8')) {
      // Started with 8xxx, add 62
      cleaned = '62' + cleaned;
    }
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Sanitize input string to prevent injection
 * Removes potentially dangerous characters
 * 
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[{}\[\]]/g, '') // Remove template brackets
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with space
    .trim()
    .substring(0, 500); // Limit length
}

/**
 * Log failed notification to database for manual follow-up
 * 
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service key
 * @param phone - Recipient phone number
 * @param message - Message that failed
 * @param error - Error details
 * @param retryCount - Current retry count
 */
async function logFailedNotification(
  supabaseUrl: string,
  supabaseKey: string,
  phone: string,
  message: string,
  error: string,
  retryCount: number
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('notification_logs' as any).insert([{
      phone_number: phone,
      message_content: message,
      provider: 'wati',
      status: 'failed',
      error_message: error,
      retry_count: retryCount,
      created_at: new Date().toISOString(),
    }]);
  } catch (logError) {
    console.error('Failed to log notification error:', logError);
  }
}

// ============================================================
// MAIN SERVICE FUNCTION
// ============================================================

/**
 * Send WhatsApp message via WATI.io API
 * 
 * @param whatsappNumber - Target WhatsApp number (with country code)
 * @param messageText - Message content to send
 * @param options - Optional configuration
 * @returns Promise resolving to WatiResponse
 */
export async function sendWatiMessage(
  whatsappNumber: string,
  messageText: string
): Promise<WatiResponse> {
  // Check for API credentials
  if (!WATI_ACCESS_TOKEN) {
    console.error('WATI_ACCESS_TOKEN not configured');
    return {
      success: false,
      error: 'WATI_ACCESS_TOKEN not configured',
      statusCode: 0,
    };
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(whatsappNumber);
  const phoneWithoutPlus = formattedPhone.replace('+', '');

  // Sanitize message
  const sanitizedMessage = sanitizeInput(messageText);

  // Build request
  const endpoint = `${WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${phoneWithoutPlus}`;
  
  const headers = {
    'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    messageText: sanitizedMessage,
  };

  // Implement retry logic
  let lastError: string = '';
  let lastStatusCode: number = 0;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      lastStatusCode = response.status;

      if (response.ok) {
        const data = await response.json();
        console.log(`WATI message sent successfully to ${formattedPhone}`);
        
        return {
          success: true,
          messageId: data.id?.toString() || data.messageId?.toString(),
          statusCode: response.status,
        };
      }

      // Check if error is retryable
      if (RETRYABLE_CODES.includes(response.status)) {
        lastError = `Retryable error: ${response.status} - ${response.statusText}`;
        console.warn(`WATI retryable error (attempt ${attempt}/${MAX_RETRIES}):`, lastError);
        
        if (attempt < MAX_RETRIES) {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1))
          );
          continue;
        }
      }

      // Non-retryable error
      const errorText = await response.text();
      lastError = `HTTP ${response.status}: ${errorText}`;
      console.error('WATI non-retryable error:', lastError);
      
      return {
        success: false,
        error: lastError,
        statusCode: response.status,
      };

    } catch (fetchError) {
      lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`WATI fetch error (attempt ${attempt}/${MAX_RETRIES}):`, lastError);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  // All retries exhausted
  console.error(`WATI message failed after ${MAX_RETRIES} attempts:`, lastError);
  
  return {
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError}`,
    statusCode: lastStatusCode,
  };
}

/**
 * Send WhatsApp message with automatic logging to database
 * 
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service key
 * @param whatsappNumber - Target WhatsApp number
 * @param messageText - Message content
 * @param metadata - Optional metadata for logging
 * @returns Promise resolving to WatiResponse
 */
export async function sendWatiMessageWithLogging(
  supabaseUrl: string,
  supabaseKey: string,
  whatsappNumber: string,
  messageText: string,
  metadata?: {
    reservationId?: string;
    templateType?: string;
    recipientType?: 'venue' | 'guest';
  }
): Promise<WatiResponse> {
  const result = await sendWatiMessage(whatsappNumber, messageText);

  // Log result to database
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('notification_logs' as any).insert([{
      phone_number: formatPhoneNumber(whatsappNumber),
      message_content: messageText.substring(0, 1000), // Limit for DB
      provider: 'wati',
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      message_id: result.messageId || null,
      reservation_id: metadata?.reservationId || null,
      recipient_type: metadata?.recipientType || 'guest',
      created_at: new Date().toISOString(),
    }]);
  } catch (logError) {
    console.error('Failed to log notification:', logError);
  }

  return result;
}

/**
 * Send template message with variables
 * 
 * @param whatsappNumber - Target WhatsApp number
 * @param templateName - Name of the template
 * @param variables - Template variables
 * @returns Promise resolving to WatiResponse
 */
export async function sendWatiTemplateMessage(
  whatsappNumber: string,
  templateName: string,
  variables: Record<string, string>
): Promise<WatiResponse> {
  // Format message based on template name
  let messageText = '';

  switch (templateName) {
    case 'regular':
      messageText = `[NIGHTLIFE ID - NEW BOOKING] 🥂\n` +
        `Halo ${sanitizeInput(variables.venue_name || '-')}, ada pesanan meja baru!\n\n` +
        `Detail Tamu:\nNama: ${sanitizeInput(variables.guest_name || '-')}\n` +
        `Tanda Pengenal: ${variables.booking_code || '-'}\n` +
        `Tanggal: ${variables.date || '-'}\n` +
        `Tipe Meja: ${variables.table_type || '-'}\n\n` +
        `Status Pembayaran:\n✅ DP PAID (Rp ${variables.amount || '0'})\n\n` +
        `NightLife ID - Elevating Your Vibe.`;
      break;

    case 'vip':
      messageText = `[NIGHTLIFE ID - VIP ALERT] 🌟\n` +
        `URGENT: High-Value Booking Terdeteksi!\n\n` +
        `${sanitizeInput(variables.guest_name || '-')} (Tier: ${variables.user_tier || '-'}) ` +
        `baru saja memesan meja.\n\n` +
        `Ringkasan:\n- Squad Size: ${variables.pax_count || '-'} Orang\n` +
        `- Vibe Preference: ${variables.music_preference || '-'}\n` +
        `- Locker Access: ${variables.has_bottle_locker || 'NO'}\n\n` +
        `Catatan AI: High-Spender detected. VIP protokol recommended.\n\n` +
        `NIGHTLIFE ID - Intelligence at Your Service.`;
      break;

    case 'web3':
      messageText = `[NIGHTLIFE ID - WEB3 TRANSACTION] ⛓️\n` +
        `Halo ${sanitizeInput(variables.venue_name || '-')}, transaksi on-chain terverifikasi.\n\n` +
        `Info Pemesanan:\nTamu: ${sanitizeInput(variables.guest_name || '-')}\n` +
        `Access Method: ${variables.nft_pass_name || '-'}\n` +
        `Benefits: ${variables.special_perks || '-'}\n\n` +
        `Transaksi telah diamankan di Smart Contract.`;
      break;

    default:
      messageText = sanitizeInput(variables.message_text || 'Notification from NightLife ID');
      break;
  }

  return sendWatiMessage(whatsappNumber, messageText);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  sendWatiMessage,
  sendWatiMessageWithLogging,
  sendWatiTemplateMessage,
  formatPhoneNumber,
  sanitizeInput,
};
