"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";

/**
 * ENTERPRISE ACTIONS - PHASE 3.2
 * Multi-Venue, RBAC 2.0, Audit Logs, Staff Performance
 */

// =====================================================
// 1. AUDIT LOGGING
// =====================================================

export async function logAuditEvent(
  venueId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        venue_id: venueId,
        user_id: user.id,
        user_email: user.email,
        user_role: "staff",
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Audit log error:", error);
    return null;
  }
}

export async function getAuditLogs(venueId: string, limit = 50) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    return [];
  }
}

// =====================================================
// 2. STAFF PERFORMANCE TRACKING
// =====================================================

export async function trackStaffActivity(
  venueId: string,
  actionType: string,
  points = 1,
  metadata?: Record<string, unknown>
) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("staff_activity")
      .insert({
        venue_id: venueId,
        user_id: user.id,
        action_type: actionType,
        points,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Staff activity error:", error);
    return null;
  }
}

export async function getStaffPerformance(venueId: string) {
  try {
    if (!supabase) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("staff_activity")
      .select("*")
      .eq("venue_id", venueId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) throw error;

    const performanceMap = new Map<string, {
      user_id: string;
      email: string;
      total_actions: number;
      points: number;
      actions: Record<string, number>;
    }>();
    
    for (const activity of data || []) {
      const userId = activity.user_id;
      if (!performanceMap.has(userId)) {
        performanceMap.set(userId, {
          user_id: userId,
          email: "Unknown",
          total_actions: 0,
          points: 0,
          actions: {},
        });
      }
      
      const stats = performanceMap.get(userId)!;
      stats.total_actions++;
      stats.points += activity.points;
      
      if (!stats.actions[activity.action_type]) {
        stats.actions[activity.action_type] = 0;
      }
      stats.actions[activity.action_type]++;
    }

    return Array.from(performanceMap.values()).sort((a, b) => b.points - a.points);
  } catch (error) {
    console.error("Staff performance error:", error);
    return [];
  }
}

// =====================================================
// 3. GRANULAR PERMISSIONS (RBAC 2.0)
// =====================================================

export type Permission =
  | "view_analytics"
  | "edit_analytics"
  | "view_promos"
  | "edit_promos"
  | "view_guests"
  | "edit_guests"
  | "view_leads"
  | "edit_leads"
  | "view_reservations"
  | "edit_reservations"
  | "view_staff"
  | "edit_staff"
  | "view_settings"
  | "edit_settings";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    "view_analytics", "edit_analytics",
    "view_promos", "edit_promos",
    "view_guests", "edit_guests",
    "view_leads", "edit_leads",
    "view_reservations", "edit_reservations",
    "view_staff", "edit_staff",
    "view_settings", "edit_settings",
  ],
  manager: [
    "view_analytics",
    "view_promos", "edit_promos",
    "view_guests", "edit_guests",
    "view_leads", "edit_leads",
    "view_reservations", "edit_reservations",
    "view_staff",
  ],
  marketing: [
    "view_analytics",
    "view_promos", "edit_promos",
    "view_leads", "edit_leads",
  ],
  ops: [
    "view_promos",
    "view_guests", "edit_guests",
    "view_reservations", "edit_reservations",
  ],
  staff: [
    "view_reservations",
  ],
};

export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function getUserPermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

// =====================================================
// 4. MULTI-VENUE MANAGEMENT
// =====================================================

export async function getUserVenues() {
  try {
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: ownedVenues } = await supabase
      .from("venues")
      .select("*")
      .eq("owner_id", user.id);

    const { data: staffVenues } = await supabase
      .from("staff_invitations")
      .select("venue:venues(*), role")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const venueMap = new Map<string, { id: string; name: string; role: string }>();
    
    if (ownedVenues) {
      for (const venue of ownedVenues) {
        venueMap.set(venue.id, { ...venue, role: "owner" });
      }
    }

    if (staffVenues) {
      for (const staffVenue of staffVenues as any[]) {
        if (staffVenue.venue && Array.isArray(staffVenue.venue) && staffVenue.venue[0]) {
          const v = staffVenue.venue[0] as any;
          venueMap.set(v.id, { 
            id: v.id,
            name: v.name,
            role: staffVenue.role 
          });
        }
      }
    }

    return Array.from(venueMap.values());
  } catch (error) {
    console.error("getUserVenues error:", error);
    return [];
  }
}

export async function getVenueWithRole(venueId: string) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: venue } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .eq("owner_id", user.id)
      .single();

    if (venue) {
      return { ...venue, role: "owner" };
    }

    const { data: staffInvite } = await supabase
      .from("staff_invitations")
      .select("role")
      .eq("venue_id", venueId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .single();

    if (staffInvite) {
      return { venue, role: staffInvite.role };
    }

    return null;
  } catch (error) {
    console.error("getVenueWithRole error:", error);
    return null;
  }
}

// =====================================================
// 5. PROMO A/B TESTING
// =====================================================

export async function createPromoABTest(
  venueId: string,
  testData: {
    name: string;
    variant_a: { title: string; description: string; discount: number };
    variant_b: { title: string; description: string; discount: number };
    start_date: string;
    end_date: string;
  }
) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("promo_ab_tests")
      .insert({
        venue_id: venueId,
        name: testData.name,
        variant_a_title: testData.variant_a.title,
        variant_a_description: testData.variant_a.description,
        variant_a_discount: testData.variant_a.discount,
        variant_b_title: testData.variant_b.title,
        variant_b_description: testData.variant_b.description,
        variant_b_discount: testData.variant_b.discount,
        start_date: testData.start_date,
        end_date: testData.end_date,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(venueId, "create_ab_test", "promo_ab_test", data.id);
    return data;
  } catch (error) {
    console.error("AB test creation error:", error);
    return null;
  }
}

export async function trackABTestClick(testId: string, variant: "a" | "b") {
  try {
    if (!supabase) return null;

    const column = variant === "a" ? "variant_a_clicks" : "variant_b_clicks";
    
    const { data, error } = await supabase.rpc("increment_ab_test_clicks", {
      test_id: testId,
      click_column: column
    });

    return data;
  } catch (error) {
    console.error("AB test click error:", error);
    return null;
  }
}

// =====================================================
// 6. AUTO-BOOST TRIGGER LOGIC
// =====================================================

export async function checkAutoBoostTrigger(venueId: string) {
  try {
    if (!supabase) return null;

    const { data: triggers } = await supabase
      .from("boost_triggers")
      .select("*")
      .eq("venue_id", venueId)
      .eq("is_active", true);

    if (!triggers?.length) return null;

    for (const trigger of triggers) {
      const threshold = trigger.threshold as { increase?: number; timeframe_hours?: number };
      const timeframeHours = threshold.timeframe_hours || 1;
      const increaseThreshold = threshold.increase || 50;

      const currentHour = new Date().getHours();
      
      const { data: currentData } = await supabase
        .from("search_analytics")
        .select("click_count")
        .eq("venue_id", venueId)
        .eq("hour", currentHour)
        .single();

      const timeframeAgo = new Date();
      timeframeAgo.setHours(timeframeAgo.getHours() - timeframeHours);

      const { data: previousData } = await supabase
        .from("search_analytics")
        .select("click_count")
        .eq("venue_id", venueId)
        .gte("created_at", timeframeAgo.toISOString());

      if (currentData?.click_count && previousData?.length) {
        const prevAvg = previousData.reduce((sum, item) => sum + (item.click_count || 0), 0) / previousData.length;
        const increase = ((currentData.click_count - prevAvg) / prevAvg) * 100;

        if (increase >= increaseThreshold) {
          await supabase
            .from("boost_triggers")
            .update({ triggered_at: new Date().toISOString() })
            .eq("id", trigger.id);

          return {
            trigger: trigger,
            increase_percent: increase,
            action: "boost_venue",
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Auto boost check error:", error);
    return null;
  }
}

// =====================================================
// 7. SOCIAL MEDIA POST GENERATOR
// =====================================================

export async function generateSocialPost(promoId: string, platform: string) {
  try {
    if (!supabase) return null;

    const { data: promo } = await supabase
      .from("promos")
      .select("*")
      .eq("id", promoId)
      .single();

    if (!promo) return null;

    const templates: Record<string, string[]> = {
      instagram: [
        `🎉 ${promo.title} - ${promo.description}!\n\nJangan lewatkan promo menarik ini. Yuk, datang sekarang!`,
        `✨ NEW PROMO! ${promo.title} ✨\n\n${promo.description}\n\nSiapa yang siap untuk malam yang luar biasa?`,
      ],
      tiktok: [
        `POV: Ada promo ${promo.title} 😱🔥\n\n${promo.description}\n\nLangsung aja ke link di bio!`,
        `Promo gilaaa ${promo.title}! 🎉\n\n${promo.discount}% OFF!`,
      ],
      twitter: [
        `🎉 Promo Menarik: ${promo.title}\n\n${promo.description}\n\nHubungi kami untuk reservasi!`,
      ],
    };

    const platformTemplates = templates[platform] || templates.instagram;
    const randomTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];

    const hashtags = randomTemplate.match(/#\w+/g) || [];

    return {
      content: randomTemplate,
      hashtags: hashtags,
      suggested_media_style: "party/lifestyle",
    };
  } catch (error) {
    console.error("Social post generation error:", error);
    return null;
  }
}

export async function createSocialPost(
  venueId: string,
  postData: {
    platform: string;
    content: string;
    hashtags: string[];
    promo_id?: string;
    scheduled_at?: string;
  }
) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        venue_id: venueId,
        promo_id: postData.promo_id,
        platform: postData.platform,
        content: postData.content,
        hashtags: postData.hashtags,
        scheduled_at: postData.scheduled_at,
        ai_caption: true,
        ai_hashtags: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(venueId, "create_social_post", "social_post", data.id);
    return data;
  } catch (error) {
    console.error("Social post error:", error);
    return null;
  }
}

// =====================================================
// 8. LEAD CRM
// =====================================================

export async function createLead(
  venueId: string,
  leadData: {
    name: string;
    phone: string;
    email?: string;
    source?: string;
    value?: number;
  }
) {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        venue_id: venueId,
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        source: leadData.source || "website",
        value: leadData.value || 0,
        assigned_to: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(venueId, "create_lead", "lead", data.id);
    await trackStaffActivity(venueId, "lead_created", 5);
    return data;
  } catch (error) {
    console.error("Lead creation error:", error);
    return null;
  }
}

export async function updateLeadStage(leadId: string, stage: string) {
  try {
    if (!supabase) return null;

    const updateData: Record<string, unknown> = {
      stage,
      updated_at: new Date().toISOString(),
    };

    if (stage === "booked" || stage === "visited") {
      updateData.converted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("lead_activity").insert({
      lead_id: leadId,
      action: "stage_changed",
      details: `Changed to ${stage}`,
    });

    return data;
  } catch (error) {
    console.error("Lead update error:", error);
    return null;
  }
}

export async function getLeadsByStage(venueId: string) {
  try {
    if (!supabase) return { todo: [], contacted: [], booked: [], visited: [], lost: [] };

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const stages = {
      todo: [] as any[],
      contacted: [] as any[],
      booked: [] as any[],
      visited: [] as any[],
      lost: [] as any[],
    };

    for (const lead of data || []) {
      const leadStage = lead.stage as keyof typeof stages;
      if (stages[leadStage]) {
        stages[leadStage].push(lead);
      }
    }

    return stages;
  } catch (error) {
    console.error("Leads fetch error:", error);
    return { todo: [], contacted: [], booked: [], visited: [], lost: [] };
  }
}

// =====================================================
// 9. GUEST MANAGEMENT
// =====================================================

export async function addGuestProfile(
  venueId: string,
  guestData: {
    name: string;
    phone: string;
    email?: string;
    status?: string;
    vipTier?: string;
  }
) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("guest_profiles")
      .insert({
        venue_id: venueId,
        name: guestData.name,
        phone: guestData.phone,
        email: guestData.email,
        status: guestData.status || "regular",
        vip_tier: guestData.vipTier,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(venueId, "create_guest", "guest_profile", data.id);
    return data;
  } catch (error) {
    console.error("Guest profile error:", error);
    return null;
  }
}

export async function updateGuestStatus(guestId: string, status: string, vipTier?: string) {
  try {
    if (!supabase) return null;

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (vipTier) {
      updateData.vip_tier = vipTier;
    }

    const { data, error } = await supabase
      .from("guest_profiles")
      .update(updateData)
      .eq("id", guestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Guest status update error:", error);
    return null;
  }
}

export async function getVIPGuests(venueId: string) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("guest_profiles")
      .select("*")
      .eq("venue_id", venueId)
      .eq("status", "vip")
      .order("total_spent", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("VIP guests fetch error:", error);
    return [];
  }
}

export async function getBlacklist(venueId: string) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("guest_profiles")
      .select("*")
      .eq("venue_id", venueId)
      .eq("status", "blacklist")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Blacklist fetch error:", error);
    return [];
  }
}

// =====================================================
// 10. REVENUE ATTRIBUTION
// =====================================================

export async function trackRevenueAttribution(
  venueId: string,
  source: string,
  potential: number,
  actual: number,
  conversions: number,
  clicks: number
) {
  try {
    if (!supabase) return null;

    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("revenue_attribution")
      .select("*")
      .eq("venue_id", venueId)
      .eq("date", today)
      .eq("source", source)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("revenue_attribution")
        .update({
          potential_revenue: (existing.potential_revenue || 0) + potential,
          actual_revenue: (existing.actual_revenue || 0) + actual,
          conversions: (existing.conversions || 0) + conversions,
          clicks: (existing.clicks || 0) + clicks,
        })
        .eq("id", existing.id)
        .select()
        .single();

      return data;
    }

    const { data, error } = await supabase
      .from("revenue_attribution")
      .insert({
        venue_id: venueId,
        date: today,
        source,
        potential_revenue: potential,
        actual_revenue: actual,
        conversions,
        clicks,
      })
      .select()
      .single();

    return data;
  } catch (error) {
    console.error("Revenue attribution error:", error);
    return null;
  }
}

export async function getRevenueAttribution(venueId: string, days = 30) {
  try {
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("revenue_attribution")
      .select("*")
      .eq("venue_id", venueId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Revenue attribution fetch error:", error);
    return [];
  }
}
