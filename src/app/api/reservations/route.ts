import { NextRequest, NextResponse } from 'next/server';
import { createReservation, getVenueAvailability, getVenueReservations, updateReservationStatus, isTimeSlotAvailable } from '@/lib/services/reservations/reservation-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      venueId,
      guestName,
      guestPhone,
      guestEmail,
      date,
      time,
      pax,
      tableType,
      notes,
      specialRequests,
      userId,
    } = body;
    
    // Validate required fields
    if (!venueId || !guestName || !guestPhone || !date || !time || !pax) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check availability
    const available = await isTimeSlotAvailable(venueId, date, time, pax);
    if (!available) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      );
    }
    
    // Create reservation
    const reservation = await createReservation({
      venueId,
      userId,
      guestName,
      guestPhone,
      guestEmail,
      date,
      time,
      pax,
      tableType,
      notes,
      specialRequests,
    });
    
    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        confirmationCode: reservation.confirmationCode,
        date: reservation.date,
        time: reservation.time,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    
    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      );
    }
    
    const reservations = await getVenueReservations(venueId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || undefined,
    });
    
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get reservations' },
      { status: 500 }
    );
  }
}
