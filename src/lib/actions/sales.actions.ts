"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";

/**
 * SALES INTELLIGENCE ACTIONS - PHASE 3.4
 * Referral System, Inventory Management, WhatsApp Automation
 */

// =====================================================
// 1. REFERRAL SYSTEM
// =====================================================

interface CreateReferralData {
  venueId: string;
  name: string;
  description?: string;
  discountPercentage?: number;
  bonusPoints?: number;
  expiresAt?: string;
}

/**
 * Create a new referral link
 */
export async function createReferralLink(data: CreateReferralData) {
  try {
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Get venue slug
    const { data: venue } = await supabase
      .from("venues")
      .select("slug")
      .eq("id", data.venueId)
      .single();

    // Generate unique code
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${venue?.slug?.slice(0, 4).toUpperCase() || "NL"}${suffix}`;

    const { data: referral, error } = await supabase
      .from("referral_links")
      .insert({
        venue_id: data.venueId,
        marketing_id: user.id,
        code,
        name: data.name,
        description: data.description,
        discount_percentage: data.discountPercentage || 0,
        bonus_points: data.bonusPoints || 0,
        expires_at: data.expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/marketing");
    return { success: true, referral };
  } catch (error) {
    console.error("Create referral error:", error);
    return { success: false, error: "Failed to create referral link" };
  }
}

/**
 * Get marketing's referral links
 */
export async function getMyReferralLinks(venueId?: string) {
  try {
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("referral_links")
      .select("*")
      .eq("marketing_id", user.id)
      .order("created_at", { ascending: false });

    if (venueId) {
      query = query.eq("venue_id", venueId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get referral links error:", error);
    return [];
  }
}

/**
 * Track referral click
 */
export async function trackReferralClick(code: string) {
  try {
    if (!supabase) return { success: false };

    const { error } = await supabase.rpc("track_referral_click", { p_code: code });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Track click error:", error);
    return { success: false };
  }
}

/**
 * Record referral conversion (when booking is made)
 */
export async function recordReferralConversion(
  code: string,
  reservationId: string,
  invoiceId: string,
  guestName: string,
  guestPhone: string,
  revenue: number
) {
  try {
    if (!supabase) return { success: false };

    const { error } = await supabase.rpc("track_referral_conversion", {
      p_code: code,
      p_reservation_id: reservationId,
      p_invoice_id: invoiceId,
      p_guest_name: guestName,
      p_guest_phone: guestPhone,
      p_revenue: revenue,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Record conversion error:", error);
    return { success: false };
  }
}

// =====================================================
// 2. INVENTORY MANAGEMENT
// =====================================================

interface InventoryItem {
  label: string;
  type: "table" | "sofa" | "room" | "booth" | "vip";
  location?: string;
  minCapacity: number;
  maxCapacity: number;
  minimumSpend?: number;
  hourlyRate?: number;
  amenities?: string[];
}

/**
 * Create inventory item
 */
export async function createInventoryItem(venueId: string, item: InventoryItem) {
  try {
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data, error } = await supabase
      .from("venue_inventory")
      .insert({
        venue_id: venueId,
        label: item.label,
        type: item.type,
        location: item.location,
        min_capacity: item.minCapacity,
        max_capacity: item.maxCapacity,
        minimum_spend: item.minimumSpend || 0,
        hourly_rate: item.hourlyRate || 0,
        amenities: item.amenities || [],
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/ops");
    return { success: true, item: data };
  } catch (error) {
    console.error("Create inventory error:", error);
    return { success: false, error: "Failed to create inventory item" };
  }
}

/**
 * Get venue inventory
 */
export async function getVenueInventory(venueId: string) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("venue_inventory")
      .select("*")
      .eq("venue_id", venueId)
      .order("type", { ascending: true })
      .order("label", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get inventory error:", error);
    return [];
  }
}

/**
 * Update inventory status
 */
export async function updateInventoryStatus(
  inventoryId: string,
  status: "available" | "booked" | "occupied" | "maintenance" | "closed",
  reservationId?: string
) {
  try {
    if (!supabase) return { success: false };

    const { data, error } = await supabase
      .from("venue_inventory")
      .update({
        status,
        current_reservation_id: reservationId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventoryId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/ops");
    return { success: true, item: data };
  } catch (error) {
    console.error("Update inventory error:", error);
    return { success: false };
  }
}

// =====================================================
// 3. WHATSAPP AUTOMATION
// =====================================================

interface WhatsAppTemplate {
  name: string;
  eventTrigger: string;
  bodyTemplate: string;
  variables?: string[];
  mediaUrl?: string;
  mediaType?: string;
}

/**
 * Create WhatsApp template
 */
export async function createWhatsAppTemplate(venueId: string, template: WhatsAppTemplate) {
  try {
    if (!supabase) return { success: false };

    const { data, error } = await supabase
      .from("whatsapp_templates")
      .insert({
        venue_id: venueId,
        name: template.name,
        event_trigger: template.eventTrigger,
        body_template: template.bodyTemplate,
        variables: template.variables || [],
        media_url: template.mediaUrl,
        media_type: template.mediaType,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, template: data };
  } catch (error) {
    console.error("Create template error:", error);
    return { success: false };
  }
}

/**
 * Send WhatsApp message (stub - would integrate with WhatsApp API)
 */
export async function sendWhatsAppMessage(
  phone: string,
  templateId: string,
  variables: Record<string, string>
) {
  try {
    if (!supabase) return { success: false };

    // Get template
    const { data: template } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (!template) return { success: false, error: "Template not found" };

    // Replace variables in template
    let messageBody = template.body_template;
    for (const [key, value] of Object.entries(variables)) {
      messageBody = messageBody.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    // In production, this would call WhatsApp API
    // For now, we'll log it
    console.log(`[WhatsApp Stub] Sending to ${phone}: ${messageBody}`);

    // Create log entry
    const { data: log, error } = await supabase
      .from("whatsapp_logs")
      .insert({
        recipient_phone: phone,
        template_id: templateId,
        message_text: messageBody,
        status: "sent",
        whatsapp_message_id: `WA_${Date.now()}`,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, log };
  } catch (error) {
    console.error("Send WhatsApp error:", error);
    return { success: false };
  }
}

/**
 * Trigger WhatsApp on invoice paid
 */
export async function triggerWhatsAppOnPayment(
  invoiceId: string,
  guestPhone: string,
  guestName: string,
  venueName: string,
  amount: number
) {
  try {
    if (!supabase) return { success: false };

    // Get venue's payment confirmation template
    const { data: template } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("event_trigger", "invoice_paid")
      .eq("is_active", true)
      .single();

    if (!template) {
      console.log("[WhatsApp] No template found for invoice_paid");
      return { success: false, error: "Template not found" };
    }

    return await sendWhatsAppMessage(guestPhone, template.id, {
      guest_name: guestName,
      venue_name: venueName,
      amount: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount),
    });
  } catch (error) {
    console.error("Trigger WhatsApp error:", error);
    return { success: false };
  }
}

// =====================================================
// 4. MARKETING PERFORMANCE
// =====================================================

/**
 * Get marketing performance analytics
 */
export async function getMarketingPerformance(venueId: string) {
  try {
    if (!supabase) return [];

    const { data: referrals } = await supabase
      .from("referral_links")
      .select("*")
      .eq("venue_id", venueId);

    // Aggregate by marketing
    const marketingMap = new Map<string, {
      id: string;
      name: string;
      clicks: number;
      conversions: number;
      revenue: number;
    }>();

    for (const ref of referrals || []) {
      const existing = marketingMap.get(ref.marketing_id);
      if (existing) {
        existing.clicks += ref.total_clicks || 0;
        existing.conversions += ref.total_conversions || 0;
        existing.revenue += Number(ref.total_revenue || 0);
      } else {
        marketingMap.set(ref.marketing_id, {
          id: ref.marketing_id,
          name: "Marketing", // Would fetch user name
          clicks: ref.total_clicks || 0,
          conversions: ref.total_conversions || 0,
          revenue: Number(ref.total_revenue || 0),
        });
      }
    }

    return Array.from(marketingMap.values()).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Get marketing performance error:", error);
    return [];
  }
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(clicks: number, conversions: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}

// =====================================================
// 5. REALTIME SUBSCRIPTION
// =====================================================

/**
 * Subscribe to inventory updates (for real-time)
 */
export function subscribeToInventoryUpdates(
  venueId: string,
  callback: (payload: any) => void
) {
  if (!supabase) return () => {};

  return supabase
    .channel(`inventory:${venueId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "venue_inventory",
        filter: `venue_id=eq.${venueId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to new reservations (for real-time alerts)
 */
export function subscribeToReservations(
  venueId: string,
  callback: (payload: any) => void
) {
  if (!supabase) return () => {};

  return supabase
    .channel(`reservations:${venueId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reservations",
        filter: `venue_id=eq.${venueId}`,
      },
      callback
    )
    .subscribe();
}
