"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Phone, Mail, Calendar, DollarSign, 
  UserPlus, MoreHorizontal, MessageCircle, X,
  CheckCircle, Clock, AlertCircle, ArrowRight
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  value: number;
  notes?: string;
  createdAt: string;
  nextFollowUp?: string;
}

const initialLeads: Record<string, Lead[]> = {
  todo: [
    { id: "1", name: "Budi Santoso", phone: "+62812345678", source: "WhatsApp", value: 5000000, createdAt: "2024-01-15", notes: "Interested in VIP package" },
    { id: "2", name: "PT Digital Media", phone: "+62898765432", email: "info@digitalmedia.id", source: "Website", value: 15000000, createdAt: "2024-01-14" },
  ],
  contacted: [
    { id: "3", name: "Sarah Wijaya", phone: "+62855667788", source: "Instagram", value: 8000000, createdAt: "2024-01-13", notes: "Follow up tomorrow" },
    { id: "4", name: "Jakarta Tech Hub", phone: "+62811223344", email: "events@jkttech.id", source: "Referral", value: 25000000, createdAt: "2024-01-12", nextFollowUp: "2024-01-16" },
  ],
  booked: [
    { id: "5", name: "Andreas Family", phone: "+62899887766", source: "WhatsApp", value: 12000000, createdAt: "2024-01-10", notes: "Birthday celebration - confirmed" },
  ],
  visited: [
    { id: "6", name: "Corporate Team A", phone: "+62855443322", email: "hr@companya.com", source: "Website", value: 35000000, createdAt: "2024-01-08", notes: "Monthly team building" },
  ],
  lost: [
    { id: "7", name: "John Doe", phone: "+62812341234", source: "Walk-in", value: 3000000, createdAt: "2024-01-05", notes: "Budget constraints" },
  ],
};

const stageConfig = {
  todo: { label: "To Do", color: "bg-gray-500", icon: Clock },
  contacted: { label: "Contacted", color: "bg-blue-500", icon: MessageCircle },
  booked: { label: "Booked", color: "bg-green-500", icon: CheckCircle },
  visited: { label: "Visited", color: "bg-purple-500", icon: Calendar },
  lost: { label: "Lost", color: "bg-red-500", icon: AlertCircle },
};

/**
 * Lead CRM Kanban Board
 */
export default function LeadsPage() {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleDragStart = (lead: Lead, stage: string) => {
    setDraggedLead({ ...lead, _stage: stage } as any);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStage: string) => {
    if (!draggedLead) return;
    
    const sourceStage = (draggedLead as any)._stage;
    if (sourceStage === targetStage) return;
    
    setLeads((prev) => {
      const newLeads = { ...prev };
      newLeads[sourceStage as keyof typeof newLeads] = newLeads[sourceStage as keyof typeof newLeads].filter((l) => l.id !== draggedLead.id);
      newLeads[targetStage as keyof typeof newLeads] = [...newLeads[targetStage as keyof typeof newLeads], draggedLead];
      return newLeads;
    });

    setDraggedLead(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalValue = Object.values(leads).flat().reduce((sum, lead) => sum + lead.value, 0);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h1 className="font-syne font-bold text-xl text-white">Lead Pipeline</h1>
          <p className="text-sm text-white/50">Manage your potential customers</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/50">Total Pipeline Value</p>
            <p className="text-lg font-bold text-[#C026D3]">{formatCurrency(totalValue)}</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {Object.entries(stageConfig).map(([stage, config]) => {
            const StageIcon = config.icon;
            const stageLeads = leads[stage as keyof typeof leads] || [];
            
            return (
              <div
                key={stage}
                className="w-80 flex flex-col bg-white/5 rounded-2xl border border-white/10"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="font-medium text-white">{config.label}</span>
                    <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  <button className="p-1 rounded hover:bg-white/10 text-white/40">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  <AnimatePresence>
                    {stageLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={() => handleDragStart(lead, stage)}
                        onClick={() => setSelectedLead(lead)}
                        className="p-4 bg-white/5 rounded-xl border border-white/10 cursor-grab hover:border-[#C026D3]/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white group-hover:text-[#C026D3] transition-colors">
                            {lead.name}
                          </h4>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded">
                            <MoreHorizontal className="w-4 h-4 text-white/40" />
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-white/50">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                          
                          {lead.email && (
                            <div className="flex items-center gap-2 text-white/50">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                              {lead.source}
                            </span>
                            <span className="text-sm font-medium text-green-400">
                              {formatCurrency(lead.value)}
                            </span>
                          </div>
                        </div>

                        {lead.notes && (
                          <p className="mt-2 text-xs text-white/40 line-clamp-2">{lead.notes}</p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/30">
                      <StageIcon className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddLeadModal onClose={() => setIsAddModalOpen(false)} onAdd={(lead) => {
            setLeads((prev) => ({
              ...prev,
              todo: [...prev.todo, { ...lead, id: Date.now().toString(), createdAt: new Date().toISOString() }],
            }));
            setIsAddModalOpen(false);
          }} />
        )}
      </AnimatePresence>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Add Lead Modal
 */
function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Omit<Lead, "id" | "createdAt">) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "WhatsApp",
    value: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Add New Lead</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Source</label>
              <select
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
              >
                <option>WhatsApp</option>
                <option>Website</option>
                <option>Instagram</option>
                <option>Referral</option>
                <option>Walk-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Potential Value</label>
            <input
              type="number"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white rounded-xl font-medium"
            >
              Add Lead
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/**
 * Lead Details Modal
 */
function LeadDetailsModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{lead.name}</h2>
              <p className="text-sm text-white/50">Added {new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-1">Phone</p>
              <p className="text-white font-medium">{lead.phone}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-1">Source</p>
              <p className="text-white font-medium">{lead.source}</p>
            </div>
          </div>

          {lead.email && (
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-1">Email</p>
              <p className="text-white font-medium">{lead.email}</p>
            </div>
          )}

          <div className="p-4 bg-gradient-to-r from-[#C026D3]/10 to-[#9333EA]/10 border border-[#C026D3]/20 rounded-xl">
            <p className="text-xs text-white/50 mb-1">Potential Value</p>
            <p className="text-2xl font-bold text-[#C026D3]">{formatCurrency(lead.value)}</p>
          </div>

          {lead.notes && (
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-1">Notes</p>
              <p className="text-white">{lead.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-white/10">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium">
            <Phone className="w-4 h-4" />
            Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
