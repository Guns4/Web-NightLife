import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// WhatsApp API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1/messages';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';

/**
 * Merchant Welcome Message Template
 * 4-Step Playbook
 */
const MERCHANT_WELCOME_MESSAGE = `
🎉 *Selamat! Partnership Anda Disetujui!*

Halo {{owner_name}}! 🎊

Selamat datang di AfterHours ID! Partnership venue Anda dengan *{{venue_name}}* telah resmi disetujui.

Sekarang Anda bisa mulai mengelola venue Anda melalui Merchant Dashboard:

📋 *4 Langkah Memulai:*

1️⃣ *Update Profil*
   Upload foto venue, deskripsi, dan jam operasional di dashboard Anda.

2️⃣ *Promo Engine*
   Buat promo menarik untuk menarik lebih banyak tamu malam ini!

3️⃣ *Trust Score (GPS)*
   Aktifkan GPS verification agar tamu bisa memverifikasi kunjungan mereka - tingkatkan kredibilitas venue Anda!

4️⃣ *Analytics*
   Pantau performa venue Anda dengan data real-time.

🔗 *Akses Dashboard:*
{{dashboard_url}}

Ada pertanyaan? Reply pesan ini atau hubungi tim support kami.

Salam,
Tim AfterHours ID 🚀
`;

/**
 * Send WhatsApp Message via API
 */
async function sendWhatsAppMessage(
  phone: string,
  templateName: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        phone_number: phone,
        template_name: templateName,
        parameters: variables,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `WhatsApp API error: ${response.status} - ${JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      messageId: data.message_id || 'unknown',
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Network error: ${error.message}`,
    };
  }
}

/**
 * Log communication to database
 */
async function logCommunication(
  venueManagerId: string,
  phone: string,
  messageType: string,
  status: 'sent' | 'failed' | 'retry',
  errorMessage?: string,
  messageId?: string
): Promise<void> {
  try {
    await supabase.from('communication_logs').insert({
      recipient_id: venueManagerId,
      phone_number: phone,
      message_type: messageType,
      status,
      error_message: errorMessage,
      external_message_id: messageId,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[OwnerApproval] Failed to log communication:', error);
  }
}

/**
 * Send Welcome Message with Retry Logic (max 3 attempts)
 */
async function sendWelcomeWithRetry(
  venueManagerId: string,
  phone: string,
  ownerName: string,
  venueName: string,
  dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
  const maxRetries = 3;
  let lastError: string | undefined;

  // Prepare variables for template
  const variables = {
    owner_name: ownerName,
    venue_name: venueName,
    dashboard_url: dashboardUrl,
  };

  // Replace template with variables for fallback text message
  let messageText = MERCHANT_WELCOME_MESSAGE;
  Object.entries(variables).forEach(([key, value]) => {
    messageText = messageText.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[OwnerApproval] Attempt ${attempt}/${maxRetries} for ${phone}`);

    const result = await sendWhatsAppMessage(phone, 'merchant_welcome_guide', variables);

    if (result.success) {
      // Log successful send
      await logCommunication(
        venueManagerId,
        phone,
        'merchant_welcome',
        'sent',
        undefined,
        result.messageId
      );
      console.log(`[OwnerApproval] Welcome message sent to ${phone}`);
      return { success: true };
    }

    lastError = result.error;
    console.error(`[OwnerApproval] Attempt ${attempt} failed:`, result.error);

    // Log retry attempt
    await logCommunication(
      venueManagerId,
      phone,
      'merchant_welcome',
      'retry',
      `Attempt ${attempt}: ${result.error}`
    );

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // All retries failed
  await logCommunication(
    venueManagerId,
    phone,
    'merchant_welcome',
    'failed',
    `All ${maxRetries} attempts failed: ${lastError}`
  );

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * POST Handler - Process owner approval webhook
 * 
 * This endpoint is called by Supabase database trigger
 * when venue_managers.status changes to 'approved'
 */
export async function POST(request: Request) {
  try {
    // 1. Security: Verify signing secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_SIGNING_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      console.error('[OwnerApproval] Unauthorized: Invalid signing secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { 
      venue_manager_id, 
      owner_name, 
      whatsapp_number, 
      venue_name,
      previous_status,
      new_status 
    } = body;

    // 3. Validate required fields
    if (!venue_manager_id || !whatsapp_number || !owner_name) {
      return NextResponse.json(
        { error: 'Missing required fields: venue_manager_id, owner_name, whatsapp_number' },
        { status: 400 }
      );
    }

    // 4. Only trigger when status changes from pending to approved
    if (previous_status === 'approved' || new_status !== 'approved') {
      console.log(`[OwnerApproval] Skipping - previous: ${previous_status}, new: ${new_status}`);
      return NextResponse.json({ 
        message: 'Skipped - status not changed to approved',
        previous_status,
        new_status 
      });
    }

    console.log(`[OwnerApproval] Processing approval for ${owner_name} (${whatsapp_number})`);

    // 5. Send welcome message with retry
    const dashboardUrl = process.env.MERCHANT_DASHBOARD_URL || 'https://nightlife.id/dashboard/owner';
    
    const result = await sendWelcomeWithRetry(
      venue_manager_id,
      whatsapp_number,
      owner_name,
      venue_name || 'Venue Anda',
      dashboardUrl
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome message sent successfully',
        venue_manager_id,
        phone: whatsapp_number,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          venue_manager_id,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[OwnerApproval] Error:', error);
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
    endpoint: 'owner-approval-webhook',
    timestamp: new Date().toISOString(),
  });
}
