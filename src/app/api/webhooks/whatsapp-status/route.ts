import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * WhatsApp Status Webhook Receiver
 * 
 * Receives callbacks from WhatsApp provider (WATI/Twilio/Fazz)
 * when message status changes: delivered, read, failed
 * 
 * Expected payload from WhatsApp provider:
 * {
 *   message_id: string,
 *   status: 'delivered' | 'read' | 'failed',
 *   timestamp: string,
 *   error_code?: string,
 *   error_message?: string
 * }
 */

export async function POST(request: Request) {
  try {
    // 1. Verify webhook signature (if provider supports it)
    const signature = request.headers.get('x-whatsapp-signature');
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    
    if (webhookSecret && signature !== webhookSecret) {
      console.error('[WhatsAppStatus] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse status update payload
    const body = await request.json();
    const { 
      message_id, 
      status, 
      timestamp,
      error_code, 
      error_message 
    } = body;

    if (!message_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: message_id, status' }, 
        { status: 400 }
      );
    }

    console.log(`[WhatsAppStatus] Received: ${message_id} -> ${status}`);

    // 3. Map WhatsApp status to our status
    const statusMap: Record<string, string> = {
      'delivered': 'delivered',
      'read': 'read',
      'seen': 'read',
      'failed': 'failed',
      'error': 'failed',
    };

    const mappedStatus = statusMap[status.toLowerCase()] || status;

    // 4. Update communication log
    const { data: log, error: findError } = await supabase
      .from('communication_logs')
      .select('id')
      .eq('external_message_id', message_id)
      .single();

    if (findError || !log) {
      // Log not found - might be a different message type
      console.log(`[WhatsAppStatus] Log not found for message_id: ${message_id}`);
      return NextResponse.json({ 
        message: 'Processed - log not found, might be different message type',
        message_id 
      });
    }

    // 5. Update the log status
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
    };

    if (mappedStatus === 'failed') {
      updateData.error_message = error_message || `Error code: ${error_code}`;
    }

    const { error: updateError } = await supabase
      .from('communication_logs')
      .update(updateData)
      .eq('id', log.id);

    if (updateError) {
      console.error('[WhatsAppStatus] Failed to update log:', updateError);
      return NextResponse.json(
        { error: 'Failed to update log' }, 
        { status: 500 }
      );
    }

    console.log(`[WhatsAppStatus] Updated log ${log.id} to status: ${mappedStatus}`);

    return NextResponse.json({
      success: true,
      message_id,
      status: mappedStatus,
    });

  } catch (error: any) {
    console.error('[WhatsAppStatus] Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}

// Also accept GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'whatsapp-status-webhook',
    timestamp: new Date().toISOString(),
  });
}
