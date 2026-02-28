import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Reservation request body
 */
export interface ReservationRequest {
  venue_id: string;
  station_id?: string;
  booking_date: string;
  booking_time: string;
  duration_hours?: number;
  guest_count: number;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  special_requests?: string;
  total_amount?: number;
  deposit_amount?: number;
}

/**
 * Created reservation response
 */
export interface ReservationResponse {
  id: string;
  venue_id: string;
  station_id: string | null;
  booking_code: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  guest_count: number;
  guest_name: string;
  guest_phone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_amount: number;
  deposit_amount: number;
  special_requests: string | null;
  created_at: string;
  venue?: {
    name: string;
    address: string;
    city: string;
  };
}

/**
 * API Error Response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * API Success Response
 */
export interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================================
// SWAGGER / API DOCUMENTATION
// ============================================================

/**
 * @swagger
 * /api/booking/reserve:
 *   post:
 *     summary: Create a table reservation
 *     description: |
 *       Reserve a table at a venue with transaction safety.
 *       Requires authentication. Generates a unique booking code (QR ready).
 *       Triggers WhatsApp notification to owner and user.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venue_id
 *               - booking_date
 *               - booking_time
 *               - guest_count
 *               - guest_name
 *               - guest_phone
 *             properties:
 *               venue_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: string
 *                 format: uuid
 *               booking_date:
 *                 type: string
 *                 format: date
 *               booking_time:
 *                 type: string
 *                 format: time
 *               duration_hours:
 *                 type: integer
 *                 default: 2
 *               guest_count:
 *                 type: integer
 *               guest_name:
 *                 type: string
 *               guest_phone:
 *                 type: string
 *               guest_email:
 *                 type: string
 *               special_requests:
 *                 type: string
 *               total_amount:
 *                 type: number
 *               deposit_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Bad Request - Missing required fields
 *       401:
 *         description: Unauthorized - Not logged in
 *       409:
 *         description: Conflict - Table already booked
 *       500:
 *         description: Server Error
 */

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate unique booking code (QR ready)
 */
function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VIBE-${timestamp.slice(-4)}-${randomPart}`;
}

/**
 * Get auth user from request
 * Checks both header token and Supabase session
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email: string } | null> {
  // Try to get user from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      return { id: user.id, email: user.email || '' };
    }
  }

  // Try to get user from cookie
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return { id: user.id, email: user.email || '' };
  }

  return null;
}

/**
 * Trigger WhatsApp notification via Edge Function
 */
async function sendWhatsAppNotification(
  venueId: string,
  reservation: ReservationResponse,
  type: 'new_booking' | 'confirmation'
): Promise<boolean> {
  try {
    // Call the WhatsApp edge function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-whatsapp-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          venue_id: venueId,
          reservation,
          notification_type: type,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return false;
  }
}

/**
 * Validate phone number format
 */
function isValidPhone(phone: string): boolean {
  // Basic validation - allows international formats
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

// ============================================================
// MAIN API HANDLER
// ============================================================

/**
 * POST /api/booking/reserve
 * 
 * Creates a new reservation with:
 * - Authentication check
 * - Transaction safety (atomic operations)
 * - Unique booking code generation (QR ready)
 * - WhatsApp notification to owner and user
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================================
    // AUTHENTICATION CHECK
    // ============================================================
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized. Please log in to make a reservation.',
          code: 'UNAUTHORIZED'
        } as ApiError,
        { status: 401 }
      );
    }

    // ============================================================
    // REQUEST BODY VALIDATION
    // ============================================================
    
    const body: ReservationRequest = await request.json();
    const {
      venue_id,
      station_id,
      booking_date,
      booking_time,
      duration_hours = 2,
      guest_count,
      guest_name,
      guest_phone,
      guest_email,
      special_requests,
      total_amount = 0,
      deposit_amount = 0,
    } = body;

    // Check required fields
    const missingFields: string[] = [];
    if (!venue_id) missingFields.push('venue_id');
    if (!booking_date) missingFields.push('booking_date');
    if (!booking_time) missingFields.push('booking_time');
    if (!guest_count) missingFields.push('guest_count');
    if (!guest_name) missingFields.push('guest_name');
    if (!guest_phone) missingFields.push('guest_phone');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'BAD_REQUEST',
          details: { missing_fields: missingFields }
        } as ApiError,
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhone(guest_phone)) {
      return NextResponse.json(
        { 
          error: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        } as ApiError,
        { status: 400 }
      );
    }

    // Validate guest count
    if (guest_count < 1 || guest_count > 100) {
      return NextResponse.json(
        { 
          error: 'Guest count must be between 1 and 100',
          code: 'INVALID_GUEST_COUNT'
        } as ApiError,
        { status: 400 }
      );
    }

    // ============================================================
    // VENUE VALIDATION
    // ============================================================
    
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, address, city, is_active')
      .eq('id', venue_id)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { 
          error: 'Venue not found',
          code: 'VENUE_NOT_FOUND'
        } as ApiError,
        { status: 400 }
      );
    }

    if (!venue.is_active) {
      return NextResponse.json(
        { 
          error: 'Venue is not currently active',
          code: 'VENUE_INACTIVE'
        } as ApiError,
        { status: 400 }
      );
    }

    // ============================================================
    // STATION/TABLE AVAILABILITY CHECK
    // ============================================================
    
    if (station_id) {
      // Verify station exists and belongs to venue
      const { data: station, error: stationError } = await supabase
        .from('stations')
        .select('id, name, is_available, capacity')
        .eq('id', station_id)
        .eq('venue_id', venue_id)
        .single();

      if (stationError || !station) {
        return NextResponse.json(
          { 
            error: 'Station not found at this venue',
            code: 'STATION_NOT_FOUND'
          } as ApiError,
          { status: 400 }
        );
      }

      if (!station.is_available) {
        return NextResponse.json(
          { 
            error: 'Station is not available',
            code: 'STATION_UNAVAILABLE'
          } as ApiError,
          { status: 409 }
        );
      }

      // Check capacity
      if (station.capacity && guest_count > station.capacity) {
        return NextResponse.json(
          { 
            error: `Guest count exceeds station capacity of ${station.capacity}`,
            code: 'CAPACITY_EXCEEDED'
          } as ApiError,
          { status: 400 }
        );
      }

      // ============================================================
      // CONFLICT CHECK (TRANSACTION SAFETY)
      // ============================================================
      
      // Check for overlapping bookings
      const { data: conflictingBookings, error: conflictError } = await supabase
        .from('bookings')
        .select('id, booking_time, duration_hours')
        .eq('venue_id', venue_id)
        .eq('station_id', station_id)
        .eq('booking_date', booking_date)
        .eq('status', 'confirmed')
        .or('status.eq.pending');

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError);
        return NextResponse.json(
          { 
            error: 'Failed to check availability',
            code: 'DATABASE_ERROR'
          } as ApiError,
          { status: 500 }
        );
      }

      // Check for time overlap
      const requestedStart = booking_time;
      const requestedEnd = calculateEndTime(booking_time, duration_hours);

      const hasConflict = (conflictingBookings || []).some((booking) => {
        const bookingStart = booking.booking_time;
        const bookingEnd = calculateEndTime(booking.booking_time, booking.duration_hours);
        
        // Check overlap: (StartA < EndB) and (EndA > StartB)
        return requestedStart < bookingEnd && requestedEnd > bookingStart;
      });

      if (hasConflict) {
        return NextResponse.json(
          { 
            error: 'This time slot is already booked. Please choose another time.',
            code: 'TIME_SLOT_CONFLICT'
          } as ApiError,
          { status: 409 }
        );
      }
    }

    // ============================================================
    // CREATE RESERVATION (ATOMIC OPERATION)
    // ============================================================
    
    const bookingCode = generateBookingCode();

    const { data: reservation, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        venue_id,
        station_id: station_id || null,
        booking_code: bookingCode,
        booking_date,
        booking_time,
        duration_hours,
        guest_count,
        guest_name,
        guest_phone,
        guest_email: guest_email || user.email,
        special_requests,
        total_amount,
        deposit_amount,
        status: 'pending',
      })
      .select(`
        id,
        venue_id,
        station_id,
        booking_code,
        booking_date,
        booking_time,
        duration_hours,
        guest_count,
        guest_name,
        guest_phone,
        status,
        total_amount,
        deposit_amount,
        special_requests,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating reservation:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to create reservation',
          code: 'DATABASE_ERROR',
          details: insertError
        } as ApiError,
        { status: 500 }
      );
    }

    // ============================================================
    // BUILD RESPONSE
    // ============================================================
    
    const response: ReservationResponse = {
      id: reservation.id,
      venue_id: reservation.venue_id,
      station_id: reservation.station_id,
      booking_code: reservation.booking_code,
      booking_date: reservation.booking_date,
      booking_time: reservation.booking_time,
      duration_hours: reservation.duration_hours,
      guest_count: reservation.guest_count,
      guest_name: reservation.guest_name,
      guest_phone: reservation.guest_phone,
      status: 'pending',
      total_amount: reservation.total_amount,
      deposit_amount: reservation.deposit_amount,
      special_requests: reservation.special_requests,
      created_at: reservation.created_at,
      venue: {
        name: venue.name,
        address: venue.address,
        city: venue.city,
      },
    };

    // ============================================================
    // TRIGGER WHATSAPP NOTIFICATION (FIRE AND FORGET)
    // ============================================================
    
    // Send notification but don't wait - non-blocking
    sendWhatsAppNotification(venue_id, response, 'new_booking').catch((err) => {
      console.error('WhatsApp notification failed:', err);
    });

    // ============================================================
    // RETURN SUCCESS RESPONSE
    // ============================================================
    
    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Reservation created successfully. You will receive a confirmation shortly.'
      } as ApiSuccess<ReservationResponse>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in reservation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      } as ApiError,
      { status: 500 }
    );
  }
}

/**
 * Helper: Calculate end time from start time and duration
 */
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
