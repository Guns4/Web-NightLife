"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";

/**
 * SETTLEMENT & REVENUE ACTIONS - PHASE 3.5
 * Platform Earnings, Payouts, Admin Dashboard
 */

// =====================================================
// 1. PLATFORM EARNINGS
// =====================================================

/**
 * Calculate and record platform fee from paid invoice
 */
export async function calculatePlatformFee(invoiceId: string) {
  try {
    if (!supabase) return { success: false };

    const { error } = await supabase.rpc("calculate_platform_fee", {
      p_invoice_id: invoiceId,
    });

    if (error) throw error;

    revalidatePath("/dashboard/owner/finance");
    return { success: true };
  } catch (error) {
    console.error("Calculate fee error:", error);
    return { success: false };
  }
}

/**
 * Get venue earnings summary
 */
export async function getVenueEarnings(venueId: string) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("platform_earnings")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const earnings = data || [];
    
    const totalGross = earnings.reduce((sum, e) => sum + Number(e.gross_amount || 0), 0);
    const totalFee = earnings.reduce((sum, e) => sum + Number(e.platform_fee_amount || 0), 0);
    const totalNet = earnings.reduce((sum, e) => sum + Number(e.net_to_venue || 0), 0);
    const pending = earnings.filter(e => e.status === "pending").reduce((sum, e) => sum + Number(e.net_to_venue || 0), 0);
    const released = earnings.filter(e => e.status === "released").reduce((sum, e) => sum + Number(e.net_to_venue || 0), 0);

    return {
      totalGross,
      totalFee,
      totalNet,
      pending,
      released,
      transactions: earnings.length,
    };
  } catch (error) {
    console.error("Get earnings error:", error);
    return null;
  }
}

// =====================================================
// 2. PAYOUT REQUESTS
// =====================================================

interface PayoutRequestData {
  venueId: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

/**
 * Request a payout
 */
export async function requestPayout(data: PayoutRequestData) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Call RPC function
    const { data: payoutId, error } = await supabase.rpc("request_payout", {
      p_venue_id: data.venueId,
      p_amount: data.amount,
      p_bank_name: data.bankName,
      p_bank_account_number: data.bankAccountNumber,
      p_bank_account_holder: data.bankAccountHolder,
    });

    if (error) throw error;

    revalidatePath("/dashboard/owner/finance");
    return { success: true, payoutId };
  } catch (error) {
    console.error("Request payout error:", error);
    return { success: false, error: "Failed to request payout" };
  }
}

/**
 * Get venue payout requests
 */
export async function getVenuePayouts(venueId: string) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get payouts error:", error);
    return [];
  }
}

/**
 * Cancel payout request (if still pending)
 */
export async function cancelPayout(payoutId: string) {
  try {
    if (!supabase) return { success: false };

    const { error } = await supabase
      .from("payout_requests")
      .update({ status: "rejected", rejection_reason: "Cancelled by user" })
      .eq("id", payoutId)
      .eq("status", "requested");

    if (error) throw error;

    revalidatePath("/dashboard/owner/finance");
    return { success: true };
  } catch (error) {
    console.error("Cancel payout error:", error);
    return { success: false };
  }
}

// =====================================================
// 3. ADMIN DASHBOARD
// =====================================================

/**
 * Get platform-wide statistics (Admin only)
 */
export async function getPlatformStats() {
  try {
    if (!supabase) return null;

    // Get all earnings
    const { data: earnings } = await supabase
      .from("platform_earnings")
      .select("*");

    // Get all payouts
    const { data: payouts } = await supabase
      .from("payout_requests")
      .select("*");

    // Get all invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, total_amount, status");

    const allEarnings = earnings || [];
    const allPayouts = payouts || [];
    const allInvoices = invoices || [];

    // Calculate totals
    const totalGross = allEarnings.reduce((sum, e) => sum + Number(e.gross_amount || 0), 0);
    const totalFee = allEarnings.reduce((sum, e) => sum + Number(e.platform_fee_amount || 0), 0);
    const totalPending = allEarnings.filter(e => e.status === "pending").reduce((sum, e) => sum + Number(e.net_to_venue || 0), 0);
    
    const pendingPayouts = allPayouts.filter(p => p.status === "requested").reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completedPayouts = allPayouts.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const paidInvoices = allInvoices.filter(i => i.status === "paid").length;
    const totalTransactions = allInvoices.length;

    return {
      totalRevenue: totalGross,
      platformProfit: totalFee,
      pendingEarnings: totalPending,
      pendingPayouts,
      completedPayouts,
      totalTransactions,
      paidInvoices,
      conversionRate: totalTransactions > 0 ? (paidInvoices / totalTransactions) * 100 : 0,
    };
  } catch (error) {
    console.error("Get platform stats error:", error);
    return null;
  }
}

/**
 * Get all payout requests (Admin)
 */
export async function getAllPayoutRequests(status?: string) {
  try {
    if (!supabase) return [];

    let query = supabase
      .from("payout_requests")
      .select(`
        *,
        venue:venues(name, slug)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get all payouts error:", error);
    return [];
  }
}

/**
 * Approve payout (Admin)
 */
export async function approvePayout(payoutId: string, transactionRef: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.rpc("approve_payout", {
      p_payout_id: payoutId,
      p_admin_id: user.id,
      p_transaction_ref: transactionRef,
    });

    if (error) throw error;

    // Release the earnings for this payout
    // (In production, would link payout to specific earnings)
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Approve payout error:", error);
    return { success: false };
  }
}

/**
 * Reject payout (Admin)
 */
export async function rejectPayout(payoutId: string, reason: string) {
  try {
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        rejection_reason: reason,
        processed_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (error) throw error;

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Reject payout error:", error);
    return { success: false };
  }
}

// =====================================================
// 4. REPORTS & EXPORT
// =====================================================

/**
 * Generate and download CSV report
 */
export async function exportPlatformReport(type: "earnings" | "payouts", filters?: {
  venueId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    if (!supabase) return null;

    let data: any[] = [];
    let headers: string[] = [];

    if (type === "earnings") {
      let query = supabase.from("platform_earnings").select("*");
      if (filters?.venueId) query = query.eq("venue_id", filters.venueId);
      if (filters?.startDate) query = query.gte("created_at", filters.startDate);
      if (filters?.endDate) query = query.lte("created_at", filters.endDate + "T23:59:59");
      
      const { data: earnings } = await query;
      data = earnings || [];
      
      headers = ["Invoice ID", "Venue ID", "Gross Amount", "Fee %", "Fee Amount", "Net Amount", "Status", "Created At"];
    } else {
      let query = supabase.from("payout_requests").select("*");
      if (filters?.venueId) query = query.eq("venue_id", filters.venueId);
      if (filters?.startDate) query = query.gte("created_at", filters.startDate);
      if (filters?.endDate) query = query.lte("created_at", filters.endDate + "T23:59:59");
      
      const { data: payouts } = await query;
      data = payouts || [];
      
      headers = ["ID", "Amount", "Bank Name", "Account Number", "Account Holder", "Status", "Requested At", "Completed At"];
    }

    // Generate CSV
    const csvRows = [headers.join(",")];
    
    for (const row of data) {
      const values = headers.map((header) => {
        const key = header.toLowerCase().replace(/ /g, "_");
        const value = row[key] || "";
        // Escape commas and quotes
        return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  } catch (error) {
    console.error("Export error:", error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
