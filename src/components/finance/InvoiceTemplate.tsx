"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  QrCode, CheckCircle, Clock, XCircle, Share2, 
  Download, Copy, Check, Mail, Phone, MapPin
} from "lucide-react";
import { formatIDR, generateWhatsAppShare, generateEmailShare } from "@/lib/actions/finance.actions";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  venue?: {
    name: string;
    slug: string;
    address?: string;
    phone?: string;
  };
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  invoice_type: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
  due_date?: string;
  item_details: InvoiceItem[];
  verification_code?: string;
  verification_url?: string;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  mode?: "preview" | "full";
}

/**
 * Premium Invoice/E-Receipt Template
 */
export default function InvoiceTemplate({ invoice, mode = "full" }: InvoiceTemplateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate QR code URL
    if (invoice.verification_url) {
      const encoded = encodeURIComponent(invoice.verification_url);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`);
    }
  }, [invoice.verification_url]);

  const copyLink = () => {
    if (invoice.verification_url) {
      navigator.clipboard.writeText(invoice.verification_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusConfig = {
    paid: { label: "PAID", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", icon: CheckCircle },
    unpaid: { label: "UNPAID", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", icon: Clock },
    cancelled: { label: "CANCELLED", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", icon: XCircle },
    refunded: { label: "REFUNDED", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", icon: XCircle },
  };

  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.unpaid;
  const StatusIcon = status.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white dark:bg-[#0A0A0F] rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#C026D3] to-[#9333EA] p-8 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold font-syne">
              {invoice.invoice_type === "invoice" ? "INVOICE" : "RECEIPT"}
            </h2>
            <p className="text-white/80 mt-1">{invoice.invoice_number}</p>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${status.bg} ${status.border}`}>
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            <span className={`font-bold ${status.color}`}>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Venue & Guest Info */}
      <div className="p-8 border-b border-gray-200 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Venue Info */}
          <div>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-1">From</p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {invoice.venue?.name || "NightLife Venue"}
            </h3>
            {invoice.venue?.address && (
              <div className="flex items-start gap-2 mt-2 text-sm text-gray-600 dark:text-white/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{invoice.venue.address}</span>
              </div>
            )}
            {invoice.venue?.phone && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-white/70">
                <Phone className="w-4 h-4" />
                <span>{invoice.venue.phone}</span>
              </div>
            )}
          </div>

          {/* Guest Info */}
          <div>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-1">Bill To</p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {invoice.guest_name || "Guest"}
            </h3>
            {invoice.guest_email && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-white/70">
                <Mail className="w-4 h-4" />
                <span>{invoice.guest_email}</span>
              </div>
            )}
            {invoice.guest_phone && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-white/70">
                <Phone className="w-4 h-4" />
                <span>{invoice.guest_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <div>
            <p className="text-sm text-gray-500 dark:text-white/50">Issue Date</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.created_at)}</p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">Due Date</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.due_date)}</p>
            </div>
          )}
          {invoice.paid_at && (
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">Paid Date</p>
              <p className="font-medium text-green-600 dark:text-green-400">{formatDate(invoice.paid_at)}</p>
            </div>
          )}
          {invoice.payment_method && (
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">Payment Method</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{invoice.payment_method}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="p-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="text-left py-3 text-sm font-semibold text-gray-600 dark:text-white/70">Item</th>
              <th className="text-center py-3 text-sm font-semibold text-gray-600 dark:text-white/70">Qty</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600 dark:text-white/70">Price</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600 dark:text-white/70">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.item_details || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-white/5">
                <td className="py-4">
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 dark:text-white/50">{item.description}</p>
                  )}
                </td>
                <td className="text-center py-4 text-gray-600 dark:text-white/70">{item.quantity}</td>
                <td className="text-right py-4 text-gray-600 dark:text-white/70">{formatIDR(item.unit_price)}</td>
                <td className="text-right py-4 font-medium text-gray-900 dark:text-white">{formatIDR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-white/70">
              <span>Subtotal</span>
              <span>{formatIDR(invoice.subtotal)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-white/70">
                <span>Tax</span>
                <span>{formatIDR(invoice.tax_amount)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatIDR(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-white/10">
              <span>Total</span>
              <span className="text-[#C026D3]">{formatIDR(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code & Verification */}
      <div className="p-8 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* QR Code */}
          <div className="flex items-center gap-4">
            {qrCodeUrl && (
              <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-md">
                <img src={qrCodeUrl} alt="Verification QR" className="w-full h-full" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
                <QrCode className="w-4 h-4" />
                <span>Scan to verify</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                Code: {invoice.verification_code?.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Actions */}
          {mode === "full" && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              
              <a
                href={generateWhatsAppShare(invoice)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </a>
              
              {invoice.guest_email && (
                <a
                  href={generateEmailShare(invoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-900 dark:bg-[#0A0A0F] text-center">
        <p className="text-sm text-white/40">
          Powered by{" "}
          <span className="text-[#C026D3] font-semibold">NightLife</span>
          <span className="text-white/60"> Indonesia</span>
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Compact Invoice Card for Lists
 */
export function InvoiceCard({ invoice }: { invoice: InvoiceData }) {
  const statusConfig = {
    paid: { label: "PAID", color: "text-green-400", bg: "bg-green-500/20" },
    unpaid: { label: "UNPAID", color: "text-amber-400", bg: "bg-amber-500/20" },
    cancelled: { label: "CANCELLED", color: "text-red-400", bg: "bg-red-500/20" },
  };

  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.unpaid;

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#C026D3]/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm text-white/70">{invoice.invoice_number}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
      <p className="text-white font-medium truncate">{invoice.guest_name || "Guest"}</p>
      <p className="text-lg font-bold text-[#C026D3] mt-1">{formatIDR(invoice.total_amount)}</p>
    </div>
  );
}
