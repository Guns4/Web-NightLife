import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/reservations
 * Get all reservations (with filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const venueId = searchParams.get('venue_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        venue:venues(id, name, category, address, city),
        station:stations(id, name, station_type, capacity),
        user:profiles(id, full_name, avatar_url)
      `)
      .order('booking_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Create a new reservation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      venue_id,
      station_id,
      booking_date,
      booking_time,
      duration_hours = 2,
      guest_count = 2,
      total_amount = 0,
      deposit_amount = 0,
      special_requests,
    } = body;

    // Validate required fields
    if (!venue_id || !booking_date || !booking_time) {
      return NextResponse.json(
        { error: 'Missing required fields: venue_id, booking_date, booking_time' },
        { status: 400 }
      );
    }

    // Check venue availability
    const { data: station } = await supabase
      .from('stations')
      .select('*')
      .eq('id', station_id || '')
      .single();

    if (station && !station.is_available) {
      return NextResponse.json(
        { error: 'Station is not available' },
        { status: 409 }
      );
    }

    // Check for conflicting bookings
    const { data: conflicting } = await supabase
      .from('bookings')
      .select('id')
      .eq('venue_id', venue_id)
      .eq('station_id', station_id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .eq('status', 'confirmed')
      .single();

    if (conflicting) {
      return NextResponse.json(
        { error: 'Time slot already booked' },
        { status: 409 }
      );
    }

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id,
        venue_id,
        station_id,
        booking_date,
        booking_time,
        duration_hours,
        guest_count,
        total_amount,
        deposit_amount,
        special_requests,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations
 * Update reservation status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, total_amount } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = { 
      status,
      updated_at: new Date().toISOString(),
    };

    if (total_amount !== undefined) {
      updates.total_amount = total_amount;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // If cancelled, release the station
    if (status === 'cancelled') {
      await supabase
        .from('stations')
        .update({ is_available: true })
        .eq('id', data.station_id);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations
 * Cancel/delete a reservation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Get booking first
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Soft delete by updating status
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Release station
    if (booking.station_id) {
      await supabase
        .from('stations')
        .update({ is_available: true })
        .eq('id', booking.station_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    );
  }
}
