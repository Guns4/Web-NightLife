/**
 * WhatsApp Concierge Utility
 * Generates dynamic booking links for AfterHoursID Venues
 * Uses modern Indonesian "gaul" slang
 */

export interface BookingData {
  venueName: string;
  guestName: string;
  date: string;
  pax: number;
}

const WHATSAPP_NUMBER = '+6285292209155';

/**
 * Generate a WhatsApp booking message with modern Indonesian slang
 * @param data - Booking details (venueName, guestName, date, pax)
 * @returns Formatted and encoded WhatsApp message URL
 */
export function generateWhatsAppBookingLink(data: BookingData): string {
  const message = `Halo AfterHoursID! 🥂

Saya ingin Happy bersama Squad saya di ${data.venueName}. Kita mencari vibe terbaik malam ini.
- Nama: ${data.guestName}
- Tanggal: ${data.date}
- Total: ${data.pax} Person

Tolong informasikan posisi yang terbaik yang masih tersedia. Make it a night to remember! 🥃

Elevating the night, AfterHoursID.`;

  const encodedMessage = encodeURIComponent(message);
  
  // Use wa.me API for direct WhatsApp opening
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp booking in new window
 * @param data - Booking details
 */
export function sendWhatsAppBooking(data: BookingData): void {
  const url = generateWhatsAppBookingLink(data);
  
  // Open in new tab for desktop, try to use WhatsApp app on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try WhatsApp app first, fallback to web
    window.open(url, '_blank');
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Generate a simple contact WhatsApp link (without booking form)
 * @param venueName - Name of the venue
 * @param phoneNumber - Optional venue WhatsApp number (uses default if not provided)
 * @returns Encoded WhatsApp link
 */
export function generateSimpleWhatsAppLink(venueName: string, phoneNumber?: string): string {
  const message = `Hi! I'm interested in booking at ${venueName}. Could you share available slots and pricing?`;
  const encodedMessage = encodeURIComponent(message);
  const phone = phoneNumber || WHATSAPP_NUMBER;
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Generate a WhatsApp link for direct venue contact
 * @param venueName - Name of the venue
 * @param venuePhone - Venue's WhatsApp number (with country code, e.g., '62812345678')
 * @returns Encoded WhatsApp link
 */
export function generateVenueWhatsAppLink(venueName: string, venuePhone: string): string {
  // Clean the phone number - remove any non-digit characters except +
  const cleanPhone = venuePhone.replace(/[^0-9+]/g, '');
  
  // Add country code if not present
  let formattedPhone = cleanPhone;
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('62')) {
      formattedPhone = cleanPhone;
    } else {
      formattedPhone = '62' + cleanPhone;
    }
  }
  
  const message = `Hi ${venueName}, I'd like to book a table! What slots are available?`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Generate a WhatsApp link with booking details
 * @param venueName - Name of the venue
 * @param venuePhone - Venue's WhatsApp number
 * @param guestName - Guest's name
 * @param date - Booking date
 * @param pax - Number of guests
 * @returns Encoded WhatsApp link
 */
export function generateBookingWhatsAppLink(
  venueName: string, 
  venuePhone: string, 
  guestName: string, 
  date: string, 
  pax: number
): string {
  // Clean the phone number
  const cleanPhone = venuePhone.replace(/[^0-9+]/g, '');
  
  // Add country code if not present
  let formattedPhone = cleanPhone;
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('62')) {
      formattedPhone = cleanPhone;
    } else {
      formattedPhone = '62' + cleanPhone;
    }
  }
  
  const message = `Hi ${venueName}! 🎉

I'd like to make a reservation:
- Name: ${guestName}
- Date: ${date}
- Guests: ${pax} person(s)

Please confirm availability. Thank you! 🙏`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
