import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateReservationParams {
  venueId: string;
  userId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  date: string;
  time: string;
  pax: number;
  tableType?: string;
  notes?: string;
  specialRequests?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  remainingCapacity: number;
}

interface BookingData {
  id: string;
  date: Date;
  time: string;
  pax: number;
}

/**
 * Generate unique confirmation code
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new reservation
 */
export async function createReservation(params: CreateReservationParams) {
  const { venueId, userId, guestName, guestPhone, guestEmail, date, time, pax, tableType, notes, specialRequests } = params;
  
  // Generate confirmation code
  const confirmationCode = generateConfirmationCode();
  
  // Create reservation
  const reservation = await prisma.booking.create({
    data: {
      venueId,
      userId,
      guestName,
      guestPhone,
      guestEmail,
      date: new Date(date),
      time,
      pax,
      tableType,
      notes,
      specialRequests,
      status: 'pending',
      confirmationCode,
    },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
  
  return reservation;
}

/**
 * Get venue availability for a specific date
 */
export async function getVenueAvailability(venueId: string, date: string): Promise<TimeSlot[]> {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Get venue details
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      openingHours: true,
    },
  });
  
  if (!venue) {
    throw new Error('Venue not found');
  }
  
  // Parse opening hours
  const openingHours = venue.openingHours as Record<string, { open: string; close: string }> | null;
  const dayHours = openingHours?.[dayOfWeek];
  
  if (!dayHours) {
    return []; // Venue is closed on this day
  }
  
  // Generate time slots (every 30 minutes)
  const slots: TimeSlot[] = [];
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    
    // Get existing reservations for this slot
    const existingReservations = await prisma.booking.findMany({
      where: {
        venueId,
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
        time: timeStr,
        status: {
          in: ['pending', 'confirmed'],
        },
      },
      select: {
        pax: true,
      },
    });
    
    const totalBooked = existingReservations.reduce((sum: number, r: { pax: number }) => sum + r.pax, 0);
    const remainingCapacity = 100 - totalBooked; // Default capacity
    
    slots.push({
      time: timeStr,
      available: remainingCapacity > 0,
      remainingCapacity,
    });
    
    // Increment by 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
}

/**
 * Check if a specific time slot is available
 */
export async function isTimeSlotAvailable(venueId: string, date: string, time: string, pax: number): Promise<boolean> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });
  
  if (!venue) return false;
  
  // Get existing bookings for this slot
  const existingBookings = await prisma.booking.findMany({
    where: {
      venueId,
      date: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
      time,
      status: {
        in: ['pending', 'confirmed'],
      },
    },
    select: { pax: true },
  });
  
  const totalBooked = existingBookings.reduce((sum: number, b: { pax: number }) => sum + b.pax, 0);
  const remainingCapacity = 100 - totalBooked;
  
  return remainingCapacity >= pax;
}

/**
 * Get all reservations for a venue
 */
export async function getVenueReservations(
  venueId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  const { startDate, endDate, status } = options || {};
  
  const where: Record<string, unknown> = { venueId };
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }
  
  if (status) {
    where.status = status;
  }
  
  const reservations = await prisma.booking.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
  
  return reservations;
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
  reservationId: string,
  status: 'confirmed' | 'cancelled' | 'completed'
) {
  const updateData: Record<string, Date> = {};
  
  if (status === 'confirmed') {
    updateData.confirmedAt = new Date();
  } else if (status === 'cancelled') {
    updateData.cancelledAt = new Date();
  } else if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  
  const reservation = await prisma.booking.update({
    where: { id: reservationId },
    data: {
      status,
      ...updateData,
    },
    include: {
      venue: true,
      user: true,
    },
  });
  
  return reservation;
}

/**
 * Get booking heatmap data for a venue
 */
export async function getBookingHeatmap(venueId: string, startDate: string, endDate: string) {
  const reservations = await prisma.booking.findMany({
    where: {
      venueId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: {
        in: ['confirmed', 'completed'],
      },
    },
    select: {
      date: true,
      time: true,
      pax: true,
    },
  });
  
  // Aggregate by day and hour
  const heatmap: Record<string, Record<string, number>> = {};
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  reservations.forEach((res: BookingData) => {
    const date = new Date(res.date);
    const day = days[date.getDay()];
    const hour = res.time.split(':')[0];
    
    if (!heatmap[day]) {
      heatmap[day] = {};
    }
    
    if (!heatmap[day][hour]) {
      heatmap[day][hour] = 0;
    }
    
    heatmap[day][hour] += res.pax;
  });
  
  return heatmap;
}

/**
 * Get all pending reservations that need cleanup (older than 24 hours)
 */
export async function getAbandonedReservations() {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);
  
  return prisma.booking.findMany({
    where: {
      status: 'pending',
      createdAt: {
        lt: cutoffTime,
      },
    },
    include: {
      venue: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Cancel abandoned reservations
 */
export async function cleanupAbandonedReservations() {
  const abandoned = await getAbandonedReservations();
  
  const ids = abandoned.map((r: { id: string }) => r.id);
  
  if (ids.length === 0) {
    return { cancelled: 0 };
  }
  
  await prisma.booking.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
    },
  });
  
  return { cancelled: ids.length };
}

export default {
  createReservation,
  getVenueAvailability,
  isTimeSlotAvailable,
  getVenueReservations,
  updateReservationStatus,
  getBookingHeatmap,
  cleanupAbandonedReservations,
};
