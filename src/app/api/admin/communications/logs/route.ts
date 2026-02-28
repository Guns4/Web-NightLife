import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/communications/logs
 * Fetch communication logs with venue and owner details
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('communication_logs')
      .select(`
        id,
        recipient_id,
        phone_number,
        message_type,
        status,
        error_message,
        external_message_id,
        sent_at,
        created_at,
        venue_managers!inner(
          full_name,
          venue_id,
          venues!inner(
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,venue_managers.full_name.ilike.%${search}%,venue_managers.venues.name.ilike.%${search}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('[AdminCommunications] Error fetching logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const transformedLogs = logs?.map(log => ({
      id: log.id,
      recipient_id: log.recipient_id,
      owner_name: log.venue_managers?.[0]?.full_name || 'Unknown',
      venue_name: log.venue_managers?.[0]?.venues?.[0]?.name || 'Unknown',
      whatsapp_number: log.phone_number,
      message_type: log.message_type,
      status: log.status,
      error_message: log.error_message,
      external_message_id: log.external_message_id,
      sent_at: log.sent_at,
      created_at: log.created_at,
    })) || [];

    // Get totals for summary
    const { count: total } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true });

    const { count: sentCount } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    const { count: failedCount } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    const successRate = total ? Math.round((sentCount || 0) / total * 100) : 0;

    return NextResponse.json({
      logs: transformedLogs,
      summary: {
        total: total || 0,
        sent: sentCount || 0,
        failed: failedCount || 0,
        success_rate: successRate,
      },
    });

  } catch (error: any) {
    console.error('[AdminCommunications] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/communications/logs
 * Resend a failed message
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { log_id, action } = body;

    if (action === 'resend' && log_id) {
      // Get the log details
      const { data: log } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('id', log_id)
        .single();

      if (!log) {
        return NextResponse.json({ error: 'Log not found' }, { status: 404 });
      }

      // Get manager details
      const { data: manager } = await supabase
        .from('venue_managers')
        .select('*, venues(name)')
        .eq('id', log.recipient_id)
        .single();

      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }

      // Call the WhatsApp webhook to resend
      const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || '/api/webhooks/owner-approval';
      
      const response = await fetch(`${request.nextUrl.origin}${webhookUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBHOOK_SIGNING_SECRET || ''}`,
        },
        body: JSON.stringify({
          venue_manager_id: manager.id,
          owner_name: manager.full_name,
          whatsapp_number: manager.whatsapp_number,
          venue_name: manager.venues?.name,
          previous_status: 'pending',
          new_status: 'approved',
          is_resend: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Message resent successfully' 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('[AdminCommunications] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
