import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * POST /api/admin/reviews/verify
 * Manually verify a review (admin action)
 */
export async function POST(request: NextRequest) {
  try {
    // Check user authentication and role
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. SUPER_ADMIN only.' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { review_id } = body;

    if (!review_id) {
      return NextResponse.json(
        { error: 'Missing required field: review_id' },
        { status: 400 }
      );
    }

    // Verify the review
    const { data, error } = await supabase
      .from('vibe_checks')
      .update({ is_verified_visit: true })
      .eq('id', review_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the admin action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'MANUAL_REVIEW_VERIFICATION',
      entity_type: 'vibe_check',
      entity_id: review_id,
      new_values: {
        verified_by: user.id,
        previous_value: false,
        new_value: true,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      review: data,
      message: 'Review manually verified'
    });

  } catch (error) {
    console.error('Error in manual verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
