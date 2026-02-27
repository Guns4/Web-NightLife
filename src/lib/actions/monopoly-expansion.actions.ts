'use server';

/**
 * MONOPOLY EXPANSION ACTIONS - PHASE 6.1-6.10
 * Indonesian Nightlife Monopoly Features
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 6.1: TAX & LEGAL COMPLIANCE
// ============================================

/**
 * Calculate tax for invoice
 */
export async function calculateInvoiceTax(
  invoiceId: string,
  cityId: string
): Promise<{ subtotal: number; tax: number; total: number }> {
  const supabase = getSupabase();
  
  // Get invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();
  
  if (!invoice) return { subtotal: 0, tax: 0, total: 0 };
  
  // Get tax config
  const { data: taxConfig } = await supabase
    .from('tax_configs')
    .select('*')
    .eq('city_id', cityId)
    .eq('is_active', true)
    .single();
  
  const taxRate = taxConfig?.tax_rate || 0.10;
  const isInclusive = taxConfig?.is_inclusive || false;
  
  let subtotal: number, tax: number, total: number;
  
  if (isInclusive) {
    subtotal = Math.round(invoice.total_amount / (1 + taxRate));
    tax = invoice.total_amount - subtotal;
    total = invoice.total_amount;
  } else {
    subtotal = invoice.total_amount;
    tax = Math.round(subtotal * taxRate);
    total = subtotal + tax;
  }
  
  // Save tax details
  await supabase
    .from('invoice_tax_details')
    .insert({
      invoice_id: invoiceId,
      tax_type: 'entertainment',
      taxable_amount: subtotal,
      tax_amount: tax,
      tax_rate: taxRate,
      city_id: cityId,
      venue_id: invoice.venue_id
    });
  
  return { subtotal, tax, total };
}

// ============================================
// 6.2: TOURISM GATEWAY
// ============================================

/**
 * Get available international payment methods
 */
export async function getInternationalPaymentMethods() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('international_payment_methods')
    .select('*')
    .eq('is_active', true);
  
  return data || [];
}

/**
 * Get venue tourist badges
 */
export async function getVenueTouristBadges(venueId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('tourist_venue_badges')
    .select('*')
    .eq('venue_id', venueId);
  
  return data || [];
}

/**
 * Translate content using AI
 */
export async function translateContent(
  sourceType: 'review' | 'menu' | 'description',
  sourceId: string,
  sourceText: string,
  targetLanguage: string
): Promise<string> {
  const supabase = getSupabase();
  
  // Check cache
  const { data: cached } = await supabase
    .from('ai_translations')
    .select('translated_text')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('target_language', targetLanguage)
    .single();
  
  if (cached) return cached.translated_text;
  
  // Mock translation (would use LLM in production)
  const translations: Record<string, string> = {
    'en': `[English] ${sourceText}`,
    'zh': `[Chinese] ${sourceText}`,
    'ja': `[Japanese] ${sourceText}`,
    'ko': `[Korean] ${sourceText}`
  };
  
  const translatedText = translations[targetLanguage] || sourceText;
  
  // Save to cache
  await supabase
    .from('ai_translations')
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      source_language: 'id',
      target_language: targetLanguage,
      translated_text: translatedText,
      ai_model: 'nightlife-translator-v1',
      confidence_score: 0.95
    });
  
  return translatedText;
}

// ============================================
// 6.3: GUEST LIST REVOLUTION
// ============================================

/**
 * Create guest list
 */
export async function createGuestList(
  venueId: string,
  data: {
    eventName: string;
    eventDate: string;
    totalSlots: number;
    isLadiesNight?: boolean;
  }
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: guestList, error } = await supabase
    .from('guest_lists')
    .insert({
      venue_id: venueId,
      event_name: data.eventName,
      event_date: data.eventDate,
      total_slots: data.totalSlots,
      is_ladies_night: data.isLadiesNight || false
    })
    .select()
    .single();
  
  return { success: !error, id: guestList?.id };
}

/**
 * Add guest to list
 */
export async function addToGuestList(
  guestListId: string,
  userId: string | null,
  guestData?: {
    name: string;
    phone: string;
    email?: string;
  }
): Promise<{ success: boolean; qrCode?: string }> {
  const supabase = getSupabase();
  
  const qrCode = `GL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const { error } = await supabase
    .from('guest_list_entries')
    .insert({
      guest_list_id: guestListId,
      user_id: userId,
      guest_name: guestData?.name,
      guest_phone: guestData?.phone,
      guest_email: guestData?.email,
      qr_code: qrCode
    });
  
  if (error) return { success: false };
  
  // Update count
  await supabase
    .rpc('increment_guest_count', { list_id: guestListId });
  
  return { success: true, qrCode };
}

/**
 * Check in guest via QR
 */
export async function checkInGuest(qrCode: string): Promise<{ success: boolean; guest?: any }> {
  const supabase = getSupabase();
  
  const { data: entry, error } = await supabase
    .from('guest_list_entries')
    .select('*, guest_list:guest_lists(event_name, venue:venues(name))')
    .eq('qr_code', qrCode)
    .single();
  
  if (error || !entry) return { success: false };
  
  if (entry.status !== 'confirmed') {
    return { success: false, guest: { error: 'Already checked in or cancelled' } };
  }
  
  await supabase
    .from('guest_list_entries')
    .update({
      status: 'checked_in',
      checked_in_at: new Date().toISOString()
    })
    .eq('id', entry.id);
  
  return { success: true, guest: entry };
}

// ============================================
// 6.4: SYNDICATE PARTNERSHIP
// ============================================

/**
 * Create venue group
 */
export async function createVenueGroup(
  ownerId: string,
  groupName: string,
  crossRewardEnabled: boolean = true
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: group, error } = await supabase
    .from('venue_groups')
    .insert({
      group_name: groupName,
      owner_id: ownerId,
      cross_reward_enabled: crossRewardEnabled
    })
    .select()
    .single();
  
  return { success: !error, id: group?.id };
}

/**
 * Add venue to group
 */
export async function addVenueToGroup(
  groupId: string,
  venueId: string
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('venue_group_members')
    .insert({
      group_id: groupId,
      venue_id: venueId
    });
  
  return { success: !error };
}

/**
 * Get cross-venue rewards
 */
export async function getCrossVenueRewards(venueId: string) {
  const supabase = getSupabase();
  
  const { data: group } = await supabase
    .from('venue_group_members')
    .select('group_id')
    .eq('venue_id', venueId)
    .single();
  
  if (!group) return [];
  
  const { data, error } = await supabase
    .from('cross_venue_rewards')
    .select('*, to_venue:venues(name, category)')
    .eq('group_id', group.group_id)
    .eq('is_active', true);
  
  return data || [];
}

// ============================================
// 6.5: INFLUENCER PORTAL
// ============================================

/**
 * Register as influencer
 */
export async function registerInfluencer(
  userId: string,
  socialData: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    followers?: number;
  }
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('influencer_profiles')
    .upsert({
      user_id: userId,
      instagram_handle: socialData.instagram,
      tiktok_handle: socialData.tiktok,
      youtube_channel: socialData.youtube,
      follower_count: socialData.followers || 0
    });
  
  return { success: true };
}

/**
 * Get influencer stats
 */
export async function getInfluencerStats(userId: string) {
  const supabase = getSupabase();
  
  const { data: profile } = await supabase
    .from('influencer_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return profile;
}

/**
 * Create influencer campaign
 */
export async function createInfluencerCampaign(
  venueId: string,
  data: {
    name: string;
    budget: number;
    commissionPerBooking: number;
    platforms: string[];
    hashtags: string[];
  }
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: campaign, error } = await supabase
    .from('influencer_campaigns')
    .insert({
      venue_id: venueId,
      campaign_name: data.name,
      total_budget: data.budget,
      commission_per_booking: data.commissionPerBooking,
      required_platforms: data.platforms,
      content_hashtags: data.hashtags,
      status: 'active'
    })
    .select()
    .single();
  
  return { success: !error, id: campaign?.id };
}

// ============================================
// 6.6: HOME SAFE PROJECT
// ============================================

/**
 * Add emergency contact
 */
export async function addEmergencyContact(
  userId: string,
  contact: {
    name: string;
    phone: string;
    relationship: string;
    isPrimary?: boolean;
  }
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      contact_name: contact.name,
      contact_phone: contact.phone,
      relationship: contact.relationship,
      is_primary: contact.isPrimary || false
    });
  
  return { success: true };
}

/**
 * Trigger SOS
 */
export async function triggerSOS(
  userId: string,
  venueId: string | null,
  location: { lat: number; lng: number },
  sosType: 'medical' | 'safety' | 'harassment' | 'emergency',
  description?: string
): Promise<{ success: boolean; sosId?: string }> {
  const supabase = getSupabase();
  
  const { data: sos, error } = await supabase
    .from('sos_events')
    .insert({
      user_id: userId,
      venue_id: venueId,
      latitude: location.lat,
      longitude: location.lng,
      sos_type: sosType,
      description
    })
    .select()
    .single();
  
  return { success: !error, sosId: sos?.id };
}

/**
 * Get transport options (Grab/Gojek)
 */
export async function getTransportOptions(
  venueId: string
): Promise<{ provider: string; estimate: string; link: string }[]> {
  // Mock - would integrate with Grab/Gojek APIs
  return [
    {
      provider: 'GrabCar',
      estimate: '15-25 min • Rp 35,000-50,000',
      link: `https://grab.com/book?venue=${venueId}`
    },
    {
      provider: 'GoCar',
      estimate: '18-28 min • Rp 40,000-55,000',
      link: `https://gojek.com/book?venue=${venueId}`
    }
  ];
}

// ============================================
// 6.7: BOTTLE SERVICE
// ============================================

/**
 * Add bottle to locker
 */
export async function addBottleToLocker(
  userId: string,
  venueId: string,
  bottle: {
    name: string;
    brand?: string;
    volume?: number;
  }
): Promise<{ success: boolean; lockerId?: string }> {
  const supabase = getSupabase();
  
  const purchaseDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months expiry
  
  const { data: locker, error } = await supabase
    .from('bottle_lockers')
    .insert({
      user_id: userId,
      venue_id: venueId,
      bottle_name: bottle.name,
      brand: bottle.brand,
      volume_ml: bottle.volume,
      purchase_date: purchaseDate.toISOString().split('T')[0],
      remaining_ml: bottle.volume,
      expiry_date: expiryDate.toISOString().split('T')[0]
    })
    .select()
    .single();
  
  return { success: !error, lockerId: locker?.id };
}

/**
 * Get user's bottles at venue
 */
export async function getUserBottles(userId: string, venueId?: string) {
  const supabase = getSupabase();
  
  let query = supabase
    .from('bottle_lockers')
    .select('*, venue:venues(name)')
    .eq('user_id', userId)
    .eq('status', 'active');
  
  if (venueId) {
    query = query.eq('venue_id', venueId);
  }
  
  const { data, error } = await query;
  return data || [];
}

// ============================================
// 6.8: EVENT & FESTIVAL
// ============================================

/**
 * Create major event
 */
export async function createMajorEvent(
  venueId: string | null,
  eventData: {
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    locationName?: string;
    lat?: number;
    lng?: number;
    totalTickets: number;
    price: number;
    hasMap?: boolean;
    hasFriendTracking?: boolean;
  }
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: event, error } = await supabase
    .from('major_events')
    .insert({
      venue_id: venueId,
      event_name: eventData.name,
      event_type: eventData.type,
      start_date: eventData.startDate,
      end_date: eventData.endDate,
      location_name: eventData.locationName,
      latitude: eventData.lat,
      longitude: eventData.lng,
      total_tickets: eventData.totalTickets,
      ticket_price: eventData.price,
      has_interactive_map: eventData.hasMap || false,
      has_friend_tracking: eventData.hasFriendTracking || false,
      status: 'published'
    })
    .select()
    .single();
  
  return { success: !error, id: event?.id };
}

/**
 * Purchase event ticket
 */
export async function purchaseEventTicket(
  eventId: string,
  userId: string
): Promise<{ success: boolean; ticketCode?: string; qrCode?: string }> {
  const supabase = getSupabase();
  
  const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const qrCode = `QR${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const { error } = await supabase
    .from('event_tickets')
    .insert({
      event_id: eventId,
      user_id: userId,
      ticket_number: ticketNumber,
      qr_code: qrCode
    });
  
  // Update sold count
  if (!error) {
    const { data: event } = await supabase
      .from('major_events')
      .select('sold_tickets')
      .eq('id', eventId)
      .single();
    
    if (event) {
      await supabase
        .from('major_events')
        .update({ sold_tickets: event.sold_tickets + 1 })
        .eq('id', eventId);
    }
  }
  
  return { success: !error, ticketCode: ticketNumber, qrCode: qrCode };
}

/**
 * Update friend location at event
 */
export async function updateFriendEventLocation(
  eventId: string,
  userId: string,
  lat: number,
  lng: number
): Promise<{ success: boolean }> {
  const supabase = getSupabase();
  
  await supabase
    .from('friend_event_locations')
    .upsert({
      event_id: eventId,
      user_id: userId,
      latitude: lat,
      longitude: lng,
      updated_at: new Date().toISOString()
    });
  
  return { success: true };
}

// ============================================
// 6.9: CORPORATE EVENTS
// ============================================

/**
 * Register corporate client
 */
export async function registerCorporateClient(
  companyData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  }
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: client, error } = await supabase
    .from('corporate_clients')
    .insert({
      company_name: companyData.name,
      company_email: companyData.email,
      company_phone: companyData.phone,
      company_address: companyData.address,
      contact_person: companyData.contactPerson
    })
    .select()
    .single();
  
  return { success: !error, id: client?.id };
}

/**
 * Create corporate booking inquiry
 */
export async function createCorporateInquiry(
  clientId: string,
  venueId: string,
  inquiry: {
    eventName: string;
    eventDate: string;
    guestCount: number;
    packageType: string;
  }
): Promise<{ success: boolean; id?: string }> {
  const supabase = getSupabase();
  
  const { data: booking, error } = await supabase
    .from('corporate_bookings')
    .insert({
      corporate_client_id: clientId,
      venue_id: venueId,
      event_name: inquiry.eventName,
      event_date: inquiry.eventDate,
      expected_guests: inquiry.guestCount,
      package_type: inquiry.packageType,
      status: 'inquiry'
    })
    .select()
    .single();
  
  return { success: !error, id: booking?.id };
}

// ============================================
// 6.10: BIG DATA ANALYTICS
// ============================================

/**
 * Get nightlife trends for city
 */
export async function getNightlifeTrends(citySlug: string) {
  const supabase = getSupabase();
  
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  
  if (!city) return null;
  
  const { data, error } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('city_id', city.id)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

/**
 * Get brand insights (anonymized)
 */
export async function getBrandInsights(brandName: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('brand_insights')
    .select('*')
    .eq('brand_name', brandName)
    .eq('is_anonymized', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

/**
 * Get national heatmap data
 */
export async function getNationalHeatmap() {
  const supabase = getSupabase();
  
  // Get live visit counts by city
  const { data, error } = await supabase
    .from('analytics_snapshots')
    .select('city_id, total_visits, top_venues')
    .order('snapshot_date', { ascending: false });
  
  return data || [];
}
