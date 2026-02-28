// @ts-nocheck - Deno-compatible edge function, TypeScript check disabled for URL imports
/**
 * Supabase Edge Function: send-booking-notification
 * 
 * Triggered by database webhook on reservations table.
 * Sends WhatsApp notifications based on booking details and user tier.
 * 
 * @author NightLife ID
 * @version 1.0.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// WhatsApp API Configuration
const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')!
const WHATSAPP_PHONE_NUMBER = Deno.env.get('WHATSAPP_PHONE_NUMBER')!
const WHATSAPP_PROVIDER = Deno.env.get('WHATSAPP_PROVIDER') || 'twilio' // twilio, wati, fazz

// Dashboard links
const DASHBOARD_BASE_URL = Deno.env.get('DASHBOARD_URL') || 'https://nightlife.id/dashboard'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ReservationRecord {
  id: string
  venue_id: string
  user_id: string
  booking_code: string
  booking_date: string
  booking_time: string
  guest_count: number
  guest_name: string
  guest_phone: string
  total_amount: number
  deposit_amount: number
  payment_method?: string
  status: string
  created_at: string
  station_id?: string
}

interface VenueRecord {
  id: string
  name: string
  address: string
  city: string
  phone?: string
}

interface UserProfile {
  id: string
  full_name: string
  phone?: string
  user_tier?: string
  nft_pass_name?: string
}

type TemplateType = 'regular' | 'vip' | 'web3'

// ============================================================
// MESSAGE TEMPLATES
// ============================================================

const MESSAGE_TEMPLATES: Record<TemplateType, string> = {
  regular: `[NIGHTLIFE ID - NEW BOOKING] 🥂
Halo {{venue_name}}, ada pesanan meja baru masuk melalui platform!

Detail Tamu:
Nama: {{guest_name}}
Tanda Pengenal: {{booking_code}}
Tanggal: {{date}}
Tipe Meja: {{table_type}}

Status Pembayaran:
✅ DP PAID (Rp {{amount}})

Mohon konfirmasi ketersediaan dan siapkan layanan terbaik Anda. Klik link untuk denah:
{{dashboard_link}}

NightLife ID - Elevating Your Vibe.`,

  vip: `[NIGHTLIFE ID - VIP ALERT] 🌟
URGENT: High-Value Booking Terdeteksi!

{{guest_name}} (Tier: {{user_tier}}) baru saja memesan meja untuk malam ini.

Ringkasan:
- Squad Size: {{pax_count}} Orang
- Vibe Preference: {{music_preference}}
- Locker Access: {{has_bottle_locker}}

Catatan AI: Tamu ini adalah High-Spender. Mohon berikan sambutan protokol VIP saat kedatangan di lobby.

Lihat Profil Lengkap Tamu:
{{dashboard_link}}

NIGHTLIFE ID - Intelligence at Your Service.`,

  web3: `[NIGHTLIFE ID - WEB3 TRANSACTION] ⛓️
Halo {{venue_name}}, transaksi on-chain terverifikasi.

Info Pemesanan:
Tamu: {{guest_name}}
Access Method: {{nft_pass_name}}
Benefits: {{special_perks}}

Transaksi telah diamankan di Smart Contract. Royalti otomatis akan diproses setelah check-in dilakukan.

Verifikasi QR Code saat tamu tiba:
{{verification_link}}`
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Select appropriate message template based on user data
 */
function selectTemplate(userTier?: string, paxCount?: number, paymentMethod?: string): TemplateType {
  // VIP Logic: Platinum/Diamond tier OR > 8 pax
  if (userTier === 'platinum' || userTier === 'diamond' || (paxCount && paxCount > 8)) {
    return 'vip'
  }
  
  // Web3 Logic: $VIBE token or NFT_PASS payment
  if (paymentMethod === '$VIBE' || paymentMethod === 'NFT_PASS') {
    return 'web3'
  }
  
  // Default: Regular booking
  return 'regular'
}

/**
 * Replace template variables with actual data
 */
function fillTemplate(template: string, data: Record<string, string>): string {
  let filled = template
  
  for (const [key, value] of Object.entries(data)) {
    filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), value || '-')
  }
  
  return filled
}

/**
 * Send WhatsApp message via external provider
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number (ensure Indonesian format)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
    
    let response: Response
    
    switch (WHATSAPP_PROVIDER) {
      case 'wati':
        response = await sendViaWati(formattedPhone, message)
        break
      case 'fazz':
        response = await sendViaFazz(formattedPhone, message)
        break
      case 'twilio':
      default:
        response = await sendViaTwilio(formattedPhone, message)
        break
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WhatsApp API error: ${response.status} - ${errorText}`)
      return { success: false, error: errorText }
    }
    
    const result = await response.json()
    return { success: true, messageId: result.messageId || result.sid || result.id }
    
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send via Twilio API
 */
async function sendViaTwilio(to: string, message: string): Promise<Response> {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`
  
  const formData = new URLSearchParams()
  formData.append('To', to)
  formData.append('From', WHATSAPP_PHONE_NUMBER)
  formData.append('Body', message)
  
  // Deno-compatible base64 encoding
  const credentials = `${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`
  const base64Credentials = globalThis.btoa(credentials)
  
  return fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })
}

/**
 * Send via Wati API
 */
async function sendViaWati(to: string, message: string): Promise<Response> {
  return fetch(`https://api.wati.io/api/v1/sendTextMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: to.replace('+', ''),
      message,
    }),
  })
}

/**
 * Send via Fazz Business API
 */
async function sendViaFazz(to: string, message: string): Promise<Response> {
  return fetch(`https://api.fazz.com/v1/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to.replace('+', ''),
      message,
    }),
  })
}

/**
 * Log notification to database for tracking
 */
async function logNotification(
  reservationId: string,
  recipientPhone: string,
  templateType: TemplateType,
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> {
  await supabase.from('whatsapp_logs').insert({
    venue_id: null, // Will be set by trigger
    name: 'booking_notification',
    event_trigger: `reservation_${status}`,
    body_template: MESSAGE_TEMPLATES[templateType],
    is_active: true,
    // Note: Additional tracking fields would need to be added to the schema
  })
  
  console.log(`Notification logged: ${reservationId} - ${templateType} - ${status}`)
}

/**
 * Fetch related data for the reservation
 */
async function fetchReservationData(reservation: ReservationRecord) {
  // Fetch venue
  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, address, city, phone')
    .eq('id', reservation.venue_id)
    .single() as { data: VenueRecord | null }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, user_tier, nft_pass_name')
    .eq('id', reservation.user_id)
    .single() as { data: UserProfile | null }
  
  // Fetch station/table info
  let tableType = 'Standard'
  if (reservation.station_id) {
    const { data: station } = await supabase
      .from('stations')
      .select('name, station_type')
      .eq('id', reservation.station_id)
      .single()
    
    if (station) {
      tableType = station.name || station.station_type || 'Standard'
    }
  }
  
  return { venue, profile, tableType }
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse the webhook payload from Supabase
    const payload = await req.json()
    
    // Handle different event types
    const record: ReservationRecord = payload.record
    const oldRecord = payload.old_record
    const eventType = payload.type // 'INSERT' | 'UPDATE'
    
    console.log(`Processing ${eventType} for reservation ${record.id}`)
    
    // Only process confirmed bookings
    if (eventType === 'UPDATE' && oldRecord?.status === record.status) {
      console.log('Status unchanged, skipping notification')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Status unchanged, no notification sent' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Check if status is confirmed (for UPDATE) or if it's a new confirmed booking
    const shouldNotify = eventType === 'INSERT' || record.status === 'confirmed'
    
    if (!shouldNotify) {
      console.log('Booking not confirmed, skipping notification')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Booking not confirmed' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Fetch related data
    const { venue, profile, tableType } = await fetchReservationData(record)
    
    if (!venue) {
      console.error('Venue not found for reservation:', record.id)
      return new Response(JSON.stringify({ error: 'Venue not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Determine template type
    const templateType = selectTemplate(
      profile?.user_tier,
      record.guest_count,
      record.payment_method
    )
    
    // Prepare template data
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID').format(amount)
    }
    
    const dashboardLink = `${DASHBOARD_BASE_URL}/owner/reservations/${record.id}`
    const verificationLink = `${DASHBOARD_BASE_URL}/verify/${record.booking_code}`
    
    const templateData: Record<string, string> = {
      venue_name: venue.name,
      guest_name: record.guest_name,
      booking_code: record.booking_code,
      date: new Date(record.booking_date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      table_type: tableType,
      amount: formatCurrency(record.deposit_amount || record.total_amount),
      dashboard_link: dashboardLink,
      verification_link: verificationLink,
      pax_count: String(record.guest_count),
      user_tier: profile?.user_tier || 'Standard',
      music_preference: 'Hip Hop / R&B', // Would come from user preferences
      has_bottle_locker: record.guest_count >= 6 ? 'YES' : 'NO',
      nft_pass_name: profile?.nft_pass_name || '-',
      special_perks: 'VIP Entry, Complimentary Drinks', // Would come from NFT/pass details
    }
    
    // Fill and send message to venue owner
    const venueMessage = fillTemplate(MESSAGE_TEMPLATES[templateType], {
      ...templateData,
      venue_name: venue.name,
    })
    
    // Get venue phone number (owner would be linked to venue)
    const ownerPhone = venue.phone || Deno.env.get('DEFAULT_OWNER_PHONE')
    
    if (ownerPhone) {
      const venueResult = await sendWhatsAppMessage(ownerPhone, venueMessage)
      
      // Log notification
      await logNotification(
        record.id,
        ownerPhone,
        templateType,
        venueResult.success ? 'sent' : 'failed',
        venueResult.messageId,
        venueResult.error
      )
      
      if (!venueResult.success) {
        console.error('Failed to send to venue:', venueResult.error)
      }
    }
    
    // Send confirmation to guest
    const guestMessage = fillTemplate(MESSAGE_TEMPLATES[templateType], {
      ...templateData,
      venue_name: venue.name,
      // Override for guest-facing message
      dashboard_link: `${DASHBOARD_BASE_URL}/my-bookings`,
      verification_link: verificationLink,
    })
    
    const guestPhone = record.guest_phone || profile?.phone
    
    if (guestPhone) {
      const guestResult = await sendWhatsAppMessage(guestPhone, guestMessage)
      
      await logNotification(
        record.id,
        guestPhone,
        templateType,
        guestResult.success ? 'sent' : 'failed',
        guestResult.messageId,
        guestResult.error
      )
      
      if (!guestResult.success) {
        console.error('Failed to send to guest:', guestResult.error)
      }
    }
    
    console.log(`Notifications sent for reservation ${record.id}`)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Notifications sent',
      template_used: templateType,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Edge Function Error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
