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
 * @returns Encoded WhatsApp link
 */
export function generateSimpleWhatsAppLink(venueName: string): string {
  const message = `Hi! I'm interested in booking at ${venueName}. Could you share available slots and pricing?`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}
