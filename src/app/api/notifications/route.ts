/**
 * =====================================================
 * NOTIFICATIONS API
 * CRUD operations for user notifications
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteOldNotifications 
} from "@/lib/services/notifications/notification-schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * GET - Fetch user notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getUserNotifications(user.id, {
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST - Mark notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === "markAllAsRead") {
      await markAllAsRead(user.id);
      return NextResponse.json({ success: true });
    }

    if (action === "markAsRead" && notificationId) {
      await markAsRead(notificationId, user.id);
      return NextResponse.json({ success: true });
    }

    if (action === "deleteOld") {
      const deletedCount = await deleteOldNotifications(30);
      return NextResponse.json({ deletedCount });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
