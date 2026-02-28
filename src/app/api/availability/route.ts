import { NextRequest, NextResponse } from 'next/server';
import { getVenueAvailability, isTimeSlotAvailable } from '@/lib/services/reservations/reservation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const pax = searchParams.get('pax');
    
    if (!venueId || !date) {
      return NextResponse.json(
        { error: 'venueId and date are required' },
        { status: 400 }
      );
    }
    
    // If specific time and pax provided, check single slot
    if (time && pax) {
      const available = await isTimeSlotAvailable(venueId, date, time, parseInt(pax));
      return NextResponse.json({ available });
    }
    
    // Otherwise return all available slots for the day
    const slots = await getVenueAvailability(venueId, date);
    
    return NextResponse.json({
      date,
      venueId,
      slots,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    );
  }
}
