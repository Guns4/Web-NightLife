import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchWeeklyReportData, formatWeeklyReportMessage, formatErrorAlertMessage } from '@/lib/utils/weekly-report';
import { generateAdminDashboardLink } from '@/lib/utils/admin-token';
import { sendWatiMessage } from '@/lib/services/wati';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CEO WhatsApp number
const CEO_WHATSAPP_NUMBER = process.env.CEO_WHATSAPP_NUMBER || '6289669094929';

// API Auth Token for security
const API_AUTH_TOKEN = process.env.WEEKLY_REPORT_AUTH_TOKEN;

/**
 * POST /api/cron/weekly-report
 * Trigger the weekly executive report
 * 
 * Can be called by:
 * 1. Cron job (with auth token)
 * 2. Manual trigger (with auth token)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API Auth Token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== API_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing auth token' },
        { status: 401 }
      );
    }

    console.log('📊 Starting weekly executive report generation...');

    // Fetch weekly data
    let reportData;
    try {
      reportData = await fetchWeeklyReportData();
    } catch (dataError) {
      console.error('❌ Failed to fetch weekly data:', dataError);
      
      // Send error alert
      const errorMessage = formatErrorAlertMessage(
        dataError instanceof Error ? dataError.message : 'Unknown error fetching data'
      );
      
      await sendWatiMessage(CEO_WHATSAPP_NUMBER, errorMessage);
      
      return NextResponse.json(
        { error: 'Failed to fetch weekly data', details: String(dataError) },
        { status: 500 }
      );
    }

    // Generate dynamic dashboard link
    let dashboardLink = '';
    try {
      dashboardLink = await generateAdminDashboardLink();
    } catch (linkError) {
      console.error('⚠️ Failed to generate dashboard link:', linkError);
      dashboardLink = 'https://nightlife.id/dashboard/super-admin/transparency';
    }

    // Format and send the report
    const baseMessage = formatWeeklyReportMessage(reportData);
    const finalMessage = baseMessage.replace(
      'https://nightlife.id/dashboard/super-admin/transparency',
      dashboardLink
    );

    // Send via WhatsApp
    const watiResponse = await sendWatiMessage(CEO_WHATSAPP_NUMBER, finalMessage);

    if (!watiResponse.success) {
      console.error('❌ Failed to send WhatsApp message:', watiResponse.error);
      
      // Log the attempt
      await supabase.from('cron_job_logs').insert({
        job_name: 'weekly_executive_report',
        status: 'failed',
        error_message: watiResponse.error || 'Failed to send WhatsApp message',
        executed_at: new Date().toISOString()
      });

      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: watiResponse.error },
        { status: 500 }
      );
    }

    console.log('✅ Weekly executive report sent successfully!');

    // Log successful execution
    await supabase.from('cron_job_logs').insert({
      job_name: 'weekly_executive_report',
      status: 'success',
      metadata: {
        message_id: watiResponse.messageId,
        data: reportData
      },
      executed_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Weekly executive report sent to CEO',
      message_id: watiResponse.messageId,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Unexpected error in weekly report:', error);

    // Send error alert
    try {
      const errorMessage = formatErrorAlertMessage(
        error instanceof Error ? error.message : 'Unexpected error'
      );
      await sendWatiMessage(CEO_WHATSAPP_NUMBER, errorMessage);
    } catch (whatsappError) {
      console.error('Failed to send error alert:', whatsappError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/weekly-report
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Weekly report endpoint is running',
    schedule: 'Every Monday at 08:00 AM WIB (UTC+7)',
    cron_expression: '0 1 * * 1'
  });
}
