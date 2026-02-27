"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, TrendingUp, TrendingDown, FileText, 
  Filter, Download, Plus, Search, MoreHorizontal,
  CheckCircle, Clock, XCircle, Eye, Mail, CreditCard
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import InvoiceTemplate, { InvoiceCard } from "@/components/finance/InvoiceTemplate";
import { formatIDR, getVenueFinances, getInvoices, updatePaymentStatus } from "@/lib/actions/finance.actions";

// Mock data for demo (would come from server action)
const mockFinances = {
  totalRevenue: 156000000,
  monthlyRevenue: 42000000,
  lastMonthRevenue: 38000000,
  monthOverMonthChange: 10.5,
  pendingAmount: 8500000,
  paidCount: 45,
  unpaidCount: 8,
  totalInvoices: 53,
  monthlyChart: [
    { month: "Jan", amount: 28000000 },
    { month: "Feb", amount: 32000000 },
    { month: "Mar", amount: 35000000 },
    { month: "Apr", amount: 29000000 },
    { month: "May", amount: 38000000 },
    { month: "Jun", amount: 42000000 },
  ],
};

const mockInvoices = [
  { id: "1", invoice_number: "INV/20240615/CLB/0001", guest_name: "PT Digital Nusantara", total_amount: 15000000, status: "paid", paid_at: "2024-06-15", created_at: "2024-06-14" },
  { id: "2", invoice_number: "INV/20240616/CLB/0002", guest_name: "Andreas Family", total_amount: 5000000, status: "paid", paid_at: "2024-06-16", created_at: "2024-06-16" },
  { id: "3", invoice_number: "INV/20240617/CLB/0003", guest_name: "Sarah Wedding", total_amount: 25000000, status: "paid", paid_at: "2024-06-17", created_at: "2024-06-17" },
  { id: "4", invoice_number: "INV/20240618/CLB/0004", guest_name: "Tech Startup ID", total_amount: 8500000, status: "unpaid", created_at: "2024-06-18" },
  { id: "5", invoice_number: "INV/20240619/CLB/0005", guest_name: "Birthday Party A", total_amount: 3500000, status: "unpaid", created_at: "2024-06-19" },
  { id: "6", invoice_number: "INV/20240620/CLB/0006", guest_name: "Jakarta Team Building", total_amount: 12000000, status: "paid", paid_at: "2024-06-20", created_at: "2024-06-20" },
];

/**
 * Finance & Billing Dashboard
 */
export default function FinancePage() {
  const [finances, setFinances] = useState(mockFinances);
  const [invoices, setInvoices] = useState(mockInvoices);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter = filter === "all" || inv.status === filter;
    const matchesSearch = !search || 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.guest_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    unpaid: invoices.filter((i) => i.status === "unpaid").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">Finance & Billing</h1>
          <p className="text-white/60">Manage invoices and track revenue</p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Total Revenue", 
            value: formatIDR(finances.totalRevenue), 
            change: `+${finances.monthOverMonthChange.toFixed(1)}%`, 
            icon: DollarSign, 
            color: "text-green-400",
            trend: "up"
          },
          { 
            title: "This Month", 
            value: formatIDR(finances.monthlyRevenue), 
            change: "vs last month", 
            icon: TrendingUp, 
            color: "text-[#C026D3]",
            trend: "up"
          },
          { 
            title: "Pending", 
            value: formatIDR(finances.pendingAmount), 
            change: `${finances.unpaidCount} invoices`, 
            icon: Clock, 
            color: "text-amber-400",
            trend: "neutral"
          },
          { 
            title: "Paid", 
            value: finances.paidCount.toString(), 
            change: "invoices", 
            icon: CheckCircle, 
            color: "text-blue-400",
            trend: "neutral"
          },
        ].map((kpi, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              <span className={`text-sm font-medium ${kpi.color === "text-green-400" ? "text-green-400" : "text-white/60"}`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-white/60 text-sm">{kpi.title}</p>
            <p className="text-2xl font-bold text-white font-inter">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
      >
        <h3 className="font-semibold text-white mb-6">Revenue Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={finances.monthlyChart}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C026D3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C026D3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                formatter={(value) => [formatIDR(Number(value)), "Revenue"]}
              />
              <Area type="monotone" dataKey="amount" stroke="#C026D3" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Invoice List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Filters */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-2">
            {["all", "paid", "unpaid", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-[#C026D3] text-white"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1 text-xs opacity-60">({statusCounts[status as keyof typeof statusCounts]})</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
              />
            </div>
            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-white/70">Invoice</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Guest</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Date</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Amount</th>
                <th className="text-center p-4 text-sm font-medium text-white/70">Status</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusConfig = {
                  paid: { label: "PAID", color: "text-green-400", bg: "bg-green-500/20", icon: CheckCircle },
                  unpaid: { label: "UNPAID", color: "text-amber-400", bg: "bg-amber-500/20", icon: Clock },
                  cancelled: { label: "CANCELLED", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },
                };
                const status = statusConfig[invoice.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm text-white/70">{invoice.invoice_number}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">{invoice.guest_name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">
                        {new Date(invoice.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-white font-bold">{formatIDR(invoice.total_amount)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center text-white/40">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No invoices found</p>
          </div>
        )}
      </motion.div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <InvoiceTemplate 
              invoice={{
                ...selectedInvoice,
                venue: { name: "Club XYZ", slug: "CLB" },
                subtotal: selectedInvoice.total_amount * 0.9,
                tax_amount: selectedInvoice.total_amount * 0.1,
                discount_amount: 0,
                invoice_type: "receipt",
                item_details: [
                  { name: "Venue Rental", quantity: 1, unit_price: selectedInvoice.total_amount * 0.7, total: selectedInvoice.total_amount * 0.7 },
                  { name: "Service Charge", quantity: 1, unit_price: selectedInvoice.total_amount * 0.2, total: selectedInvoice.total_amount * 0.2 },
                ],
                verification_code: "ABC123DEF456",
                verification_url: "https://nightlife.id/verify/ABC123",
              }}
              mode="full"
            />
            <button
              onClick={() => setSelectedInvoice(null)}
              className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}

/**
 * Create Invoice Modal
 */
function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    items: [{ name: "", quantity: 1, price: 0 }],
    taxRate: 10,
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * (formData.taxRate / 100);
  const total = subtotal + tax;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create New Invoice</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Guest Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Guest Name"
                value={formData.guestName}
                onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
              />
              <input
                type="email"
                placeholder="Guest Email"
                value={formData.guestEmail}
                onChange={e => setFormData({ ...formData, guestEmail: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
              />
              <input
                type="tel"
                placeholder="Guest Phone"
                value={formData.guestPhone}
                onChange={e => setFormData({ ...formData, guestPhone: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">Items</h3>
              <button
                onClick={addItem}
                className="text-sm text-[#C026D3] hover:text-[#C026D3]/80"
              >
                + Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={e => updateItem(index, "name", e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50 text-center"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={e => updateItem(index, "price", parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50 text-right"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-white/40 hover:text-red-400"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70">Tax Rate (%):</label>
            <input
              type="number"
              value={formData.taxRate}
              onChange={e => setFormData({ ...formData, taxRate: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50 text-center"
            />
          </div>

          {/* Totals */}
          <div className="p-4 bg-white/5 rounded-xl space-y-2">
            <div className="flex justify-between text-white/70">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Tax ({formData.taxRate}%)</span>
              <span>{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="text-[#C026D3]">{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white rounded-xl font-medium">
            Create Invoice
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
