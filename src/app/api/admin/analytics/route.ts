/**
 * =====================================================
 * ADMIN ANALYTICS API
 * Dashboard metrics and data aggregation
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  getDashboardMetrics, 
  getRevenueByCity, 
  getUserTrends, 
  getAdPerformance,
  getRealTimeMetrics,
  getRevenueMetrics 
} from "@/lib/services/analytics/analytics-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verify admin access
 */
async function requireAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === "SUPER_ADMIN" || data?.role === "ADMIN";
}

/**
 * GET - Fetch analytics data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "dashboard";
    const days = parseInt(searchParams.get("days") || "30");

    switch (type) {
      case "dashboard":
        return NextResponse.json(await getDashboardMetrics());
      
      case "revenueByCity":
        return NextResponse.json(await getRevenueByCity());
      
      case "userTrends":
        return NextResponse.json(await getUserTrends());
      
      case "adPerformance":
        return NextResponse.json(await getAdPerformance());
      
      case "realtime":
        return NextResponse.json(await getRealTimeMetrics());
      
      case "revenue":
        return NextResponse.json(await getRevenueMetrics(days));
      
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
