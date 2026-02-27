"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";

/**
 * SOCIAL GRAPH ACTIONS - PHASE 4.1
 * Friends, Privacy, Social Features
 */

// =====================================================
// 1. FRIEND MANAGEMENT
// =====================================================

/**
 * Send friend request
 */
export async function sendFriendRequest(friendId: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (friendId === user.id) {
      return { success: false, error: "Cannot add yourself" };
    }

    const { error } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

    if (error) throw error;

    revalidatePath("/profile/circle");
    return { success: true };
  } catch (error) {
    console.error("Send friend request error:", error);
    return { success: false, error: "Failed to send friend request" };
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(friendshipId: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("friend_id", user.id);

    revalidatePath("/profile/circle");
    return { success: true };
  } catch (error) {
    console.error("Accept friend request error:", error);
    return { success: false };
  }
}

/**
 * Get my friends list
 */
export async function getMyFriends() {
  try {
    if (!supabase) return { friends: [], requests: [] };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { friends: [], requests: [] };

    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id, status, created_at")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    const { data: requests } = await supabase
      .from("friendships")
      .select("id, user_id, created_at")
      .eq("friend_id", user.id)
      .eq("status", "pending");

    return {
      friends: friendships || [],
      requests: requests || [],
    };
  } catch (error) {
    console.error("Get friends error:", error);
    return { friends: [], requests: [] };
  }
}

// =====================================================
// 2. PRIVACY SETTINGS
// =====================================================

/**
 * Get privacy settings
 */
export async function getPrivacySettings() {
  try {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_privacy_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return data || {
      share_location_to: "none",
      show_checkin_history: false,
      show_venue_history: true,
      is_incognito: false,
      allow_friend_requests: true,
      show_online_status: true,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(settings: {
  share_location_to?: "all_friends" | "select_friends" | "none";
  show_checkin_history?: boolean;
  is_incognito?: boolean;
}) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("user_privacy_settings")
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath("/profile/circle");
    return { success: true };
  } catch (error) {
    console.error("Update privacy error:", error);
    return { success: false };
  }
}

/**
 * Toggle incognito mode
 */
export async function toggleIncognito(enable: boolean) {
  return updatePrivacySettings({
    is_incognito: enable,
    share_location_to: enable ? "none" : undefined,
  });
}

// =====================================================
// 3. FRIEND ACTIVITY & CHECK-INS
// =====================================================

/**
 * Get friends at a specific venue
 */
export async function getFriendsAtVenue(venueId: string) {
  try {
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: friendIds } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const friendIdList = (friendIds || []).map(f => f.friend_id);
    if (friendIdList.length === 0) return [];

    const { data: checkins } = await supabase
      .from("friend_checkins")
      .select("id, user_id, checked_in_at, visible_to_friends")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .in("user_id", friendIdList);

    return checkins || [];
  } catch (error) {
    console.error("Get friends at venue error:", error);
    return [];
  }
}

/**
 * Get friend activity feed
 */
export async function getFriendActivityFeed() {
  try {
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: friendIds } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const friendIdList = (friendIds || []).map(f => f.friend_id);
    if (friendIdList.length === 0) return [];

    const { data: recentCheckins } = await supabase
      .from("friend_checkins")
      .select("id, user_id, checked_in_at, venue_id, visible_to_friends")
      .in("user_id", friendIdList)
      .eq("is_active", true)
      .order("checked_in_at", { ascending: false })
      .limit(20);

    return recentCheckins || [];
  } catch (error) {
    console.error("Get friend activity error:", error);
    return [];
  }
}

// =====================================================
// 4. VIBE INVITE
// =====================================================

/**
 * Create vibe invite
 */
export async function createVibeInvite(venueId: string, message?: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: invite, error } = await supabase
      .from("vibe_invites")
      .insert({
        user_id: user.id,
        venue_id: venueId,
        code,
        message,
        max_uses: 10,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, invite };
  } catch (error) {
    console.error("Create vibe invite error:", error);
    return { success: false };
  }
}

/**
 * Generate WhatsApp share link for vibe invite
 */
export function generateVibeInviteLink(inviteCode: string, venueName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nightlife.id";
  const inviteUrl = baseUrl + "/invite/" + inviteCode;
  
  const message = "🎉 Join me at " + venueName + "!\n\nLet's vibe together! Click the link to join:\n" + inviteUrl + "\n\nSee you there! 🎶";

  return "https://wa.me/?text=" + encodeURIComponent(message);
}

// =====================================================
// 5. SQUAD BOOKINGS & GAMIFICATION
// =====================================================

/**
 * Create squad booking
 */
export async function createSquadBooking(data: {
  venueId: string;
  title: string;
  scheduledAt: string;
  maxMembers: number;
}) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: booking, error } = await supabase
      .from("squad_bookings")
      .insert({
        owner_id: user.id,
        venue_id: data.venueId,
        title: data.title,
        scheduled_at: data.scheduledAt,
        max_members: data.maxMembers,
        member_ids: [user.id],
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking };
  } catch (error) {
    console.error("Create squad booking error:", error);
    return { success: false };
  }
}

/**
 * Join squad booking
 */
export async function joinSquad(bookingId: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: booking } = await supabase
      .from("squad_bookings")
      .select("member_ids, max_members")
      .eq("id", bookingId)
      .single();

    if (!booking) return { success: false, error: "Booking not found" };

    if ((booking.member_ids || []).length >= booking.max_members) {
      return { success: false, error: "Squad is full" };
    }

    const { error } = await supabase
      .from("squad_bookings")
      .update({
        member_ids: [...(booking.member_ids || []), user.id],
      })
      .eq("id", bookingId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Join squad error:", error);
    return { success: false };
  }
}

/**
 * Calculate XP with squad bonus
 */
export async function checkSquadBonus(venueId: string): Promise<{
  bonusMultiplier: number;
  xpEarned: number;
  isSquadBonus: boolean;
}> {
  try {
    if (!supabase) return { bonusMultiplier: 1, xpEarned: 100, isSquadBonus: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { bonusMultiplier: 1, xpEarned: 100, isSquadBonus: false };

    const { data: friendIds } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const friendIdList = (friendIds || []).map(f => f.friend_id);
    if (friendIdList.length === 0) return { bonusMultiplier: 1, xpEarned: 100, isSquadBonus: false };

    const { data: checkin } = await supabase
      .from("friend_checkins")
      .select("user_id")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .in("user_id", friendIdList);

    const friendsAtVenue = (checkin || []).length;

    if (friendsAtVenue >= 2) {
      return { bonusMultiplier: 1.5, xpEarned: 150, isSquadBonus: true };
    }

    return { bonusMultiplier: 1, xpEarned: 100, isSquadBonus: false };
  } catch (error) {
    console.error("Check squad bonus error:", error);
    return { bonusMultiplier: 1, xpEarned: 100, isSquadBonus: false };
  }
}
