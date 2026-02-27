"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/client";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CreateInvoiceData {
  venueId: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  invoiceType?: "invoice" | "receipt";
  items: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  dueDate?: string;
  notes?: string;
}

interface InvoiceFilters {
  venueId: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Generate a unique invoice number
 */
function generateInvoiceNumber(venueCode: string): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV/${dateStr}/${venueCode.toUpperCase()}/${random}`;
}

/**
 * Generate verification code for QR
 */
function generateVerificationCode(): string {
  const chars = "ABCDEF0123456789";
  let code = "";
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format currency to IDR
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceData) {
  try {
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    
    // Get venue code
    const { data: venue } = await supabase
      .from("venues")
      .select("name, slug")
      .eq("id", data.venueId)
      .single();

    const venueCode = venue?.slug || venue?.name?.slice(0, 3).toUpperCase() || "VEN";

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate codes
    const invoiceNumber = generateInvoiceNumber(venueCode);
    const verificationCode = generateVerificationCode();
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://nightlife.id"}/verify/${verificationCode}`;

    const invoiceData = {
      invoice_number: invoiceNumber,
      venue_id: data.venueId,
      user_id: data.userId,
      invoice_type: data.invoiceType || "receipt",
      guest_name: data.guestName,
      guest_email: data.guestEmail,
      guest_phone: data.guestPhone,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: "unpaid",
      due_date: data.dueDate || null,
      item_details: data.items,
      verification_code: verificationCode,
      verification_url: verificationUrl,
      notes: data.notes,
    };

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;

    // Log creation
    if (user) {
      await supabase.from("transaction_logs").insert({
        invoice_id: invoice.id,
        action: "created",
        performed_by: user.id,
        performed_by_email: user.email,
        new_status: "unpaid",
        amount: totalAmount,
      });
    }

    revalidatePath("/dashboard/owner/finance");
    return { success: true, invoice };
  } catch (error) {
    console.error("Create invoice error:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  invoiceId: string,
  status: "paid" | "cancelled" | "refunded",
  paymentMethod?: string,
  paymentReference?: string
) {
  try {
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Get current invoice
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (!currentInvoice) return { success: false, error: "Invoice not found" };
    if (currentInvoice.status === "paid" && status !== "refunded") {
      return { success: false, error: "Invoice already paid" };
    }

    // Update invoice
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "paid") {
      updateData.payment_method = paymentMethod;
      updateData.payment_reference = paymentReference;
      updateData.paid_at = new Date().toISOString();
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) throw error;

    // Log the status change
    await supabase.from("transaction_logs").insert({
      invoice_id: invoiceId,
      action: status,
      performed_by: user.id,
      performed_by_email: user.email,
      previous_status: currentInvoice.status,
      new_status: status,
      amount: currentInvoice.total_amount,
      notes: `Payment ${status} via ${paymentMethod || "manual"}`,
    });

    revalidatePath("/dashboard/owner/finance");
    return { success: true, invoice };
  } catch (error) {
    console.error("Update payment error:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}

/**
 * Get venue finances (aggregated data)
 */
export async function getVenueFinances(venueId: string) {
  try {
    if (!supabase) return null;

    // Get all invoices for venue
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate totals
    const allInvoices = invoices || [];
    
    const totalRevenue = allInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const monthlyRevenue = allInvoices
      .filter((inv) => inv.status === "paid" && new Date(inv.paid_at) >= startOfMonth)
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const lastMonthRevenue = allInvoices
      .filter((inv) => 
        inv.status === "paid" && 
        new Date(inv.paid_at) >= startOfLastMonth && 
        new Date(inv.paid_at) <= endOfLastMonth
      )
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const pendingInvoices = allInvoices
      .filter((inv) => inv.status === "unpaid")
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const paidCount = allInvoices.filter((inv) => inv.status === "paid").length;
    const unpaidCount = allInvoices.filter((inv) => inv.status === "unpaid").length;

    // Monthly trend (last 6 months)
    const monthlyData: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      monthlyData[key] = 0;
    }

    allInvoices
      .filter((inv) => inv.status === "paid" && inv.paid_at)
      .forEach((inv) => {
        const date = new Date(inv.paid_at);
        const key = date.toLocaleDateString("en-US", { month: "short" });
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += Number(inv.total_amount || 0);
        }
      });

    return {
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      monthOverMonthChange: lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0,
      pendingAmount: pendingInvoices,
      paidCount,
      unpaidCount,
      totalInvoices: allInvoices.length,
      monthlyChart: Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount,
      })),
    };
  } catch (error) {
    console.error("Get venue finances error:", error);
    return null;
  }
}

/**
 * Get invoices with filters
 */
export async function getInvoices(filters: InvoiceFilters) {
  try {
    if (!supabase) return [];

    let query = supabase
      .from("invoices")
      .select("*")
      .eq("venue_id", filters.venueId);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate + "T23:59:59");
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,guest_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get invoices error:", error);
    return [];
  }
}

/**
 * Get single invoice with details
 */
export async function getInvoice(invoiceId: string) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Get invoice error:", error);
    return null;
  }
}

/**
 * Get invoice transaction history
 */
export async function getInvoiceHistory(invoiceId: string) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("transaction_logs")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get invoice history error:", error);
    return [];
  }
}

/**
 * Verify invoice authenticity via QR code
 */
export async function verifyInvoice(verificationCode: string) {
  try {
    if (!supabase) return { valid: false, error: "Database not configured" };

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        *,
        venue:venues(name, slug, address, phone)
      `)
      .eq("verification_code", verificationCode)
      .single();

    if (error || !invoice) {
      return { valid: false, error: "Invoice not found" };
    }

    // Log the verification
    await supabase.from("transaction_logs").insert({
      invoice_id: invoice.id,
      action: "verified",
      new_status: invoice.status,
      amount: invoice.total_amount,
    });

    return { 
      valid: true, 
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        venueName: invoice.venue?.name,
        guestName: invoice.guest_name,
        totalAmount: invoice.total_amount,
        status: invoice.status,
        paidAt: invoice.paid_at,
        createdAt: invoice.created_at,
      }
    };
  } catch (error) {
    console.error("Verify invoice error:", error);
    return { valid: false, error: "Verification failed" };
  }
}

/**
 * Generate WhatsApp share link for invoice
 */
export function generateWhatsAppShare(invoice: {
  invoice_number: string;
  guest_name?: string;
  total_amount: number;
  status: string;
  verification_url?: string;
}) {
  const message = `🎉 *Receipt from NightLife*\n\n` +
    `Invoice: ${invoice.invoice_number}\n` +
    `Guest: ${invoice.guest_name || "Guest"}\n` +
    `Amount: ${formatIDR(invoice.total_amount)}\n` +
    `Status: ${invoice.status === "paid" ? "✅ PAID" : "⏳ UNPAID"}\n\n` +
    (invoice.verification_url ? `Verify: ${invoice.verification_url}\n\n` : "") +
    `_Powered by NightLife Indonesia_`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Generate email share link for invoice
 */
export function generateEmailShare(invoice: {
  invoice_number: string;
  guest_email?: string;
  guest_name?: string;
  total_amount: number;
  status: string;
}) {
  const subject = encodeURIComponent(`Your Receipt - ${invoice.invoice_number}`);
  const body = encodeURIComponent(
    `Dear ${invoice.guest_name || "Guest"},\n\n` +
    `Thank you for your visit!\n\n` +
    `Invoice Number: ${invoice.invoice_number}\n` +
    `Total Amount: ${formatIDR(invoice.total_amount)}\n` +
    `Status: ${invoice.status === "paid" ? "PAID" : "UNPAID"}\n\n` +
    `View your receipt on NightLife Indonesia.\n\n` +
    `Best regards,\nNightLife Indonesia`
  );

  return `mailto:${invoice.guest_email || ""}?subject=${subject}&body=${body}`;
}
