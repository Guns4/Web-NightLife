/**
 * =====================================================
 * NOTIFICATION CLEANUP CRON JOB
 * Runs daily to delete old notifications
 * 
 * Run daily at 2 AM UTC (9 AM WITA)
 * =====================================================
 */

import { NextResponse } from "next/server";
import { deleteOldNotifications } from "@/lib/services/notifications/notification-schema";

export const maxDuration = 60; // Max 60 seconds

export async function GET() {
  try {
    console.log("Starting notification cleanup job...");

    // Delete read notifications older than 30 days
    const deletedCount = await deleteOldNotifications(30);

    console.log(`Notification cleanup complete. Deleted ${deletedCount} old notifications.`);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} old notifications`,
    });
  } catch (error) {
    console.error("Notification cleanup failed:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
