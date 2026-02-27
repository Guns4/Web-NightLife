"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Grid, List, Armchair, DoorOpen, Users, 
  Wifi, Music, Tv, MoreVertical, Check, X, 
  Edit2, Trash2, RefreshCw
} from "lucide-react";
import { updateInventoryStatus } from "@/lib/actions/sales.actions";

type ItemType = "table" | "sofa" | "room" | "booth" | "vip";
type ItemStatus = "available" | "booked" | "occupied" | "maintenance" | "closed";

interface InventoryItem {
  id: string;
  label: string;
  type: ItemType;
  location?: string;
  min_capacity: number;
  max_capacity: number;
  minimum_spend: number;
  status: ItemStatus;
  amenities: string[];
}

// Mock data
const mockInventory: InventoryItem[] = [
  { id: "1", label: "VIP Room A", type: "vip", location: "VIP Section", min_capacity: 8, max_capacity: 15, minimum_spend: 5000000, status: "occupied", amenities: ["wifi", "tv", "sound_system"] },
  { id: "2", label: "VIP Room B", type: "vip", location: "VIP Section", min_capacity: 6, max_capacity: 12, minimum_spend: 4000000, status: "available", amenities: ["wifi", "tv"] },
  { id: "3", label: "Table 1", type: "table", location: "Main Floor", min_capacity: 4, max_capacity: 8, minimum_spend: 1500000, status: "booked", amenities: [] },
  { id: "4", label: "Table 2", type: "table", location: "Main Floor", min_capacity: 4, max_capacity: 6, minimum_spend: 1000000, status: "available", amenities: [] },
  { id: "5", label: "Table 3", type: "table", location: "Main Floor", min_capacity: 2, max_capacity: 4, minimum_spend: 500000, status: "available", amenities: [] },
  { id: "6", label: "Sofa 1", type: "sofa", location: "Lounge", min_capacity: 4, max_capacity: 6, minimum_spend: 2000000, status: "occupied", amenities: ["wifi"] },
  { id: "7", label: "Sofa 2", type: "sofa", location: "Lounge", min_capacity: 4, max_capacity: 6, minimum_spend: 2000000, status: "available", amenities: ["wifi"] },
  { id: "8", label: "Booth 1", type: "booth", location: "Corner", min_capacity: 6, max_capacity: 10, minimum_spend: 2500000, status: "maintenance", amenities: ["tv"] },
  { id: "9", label: "Room 1", type: "room", location: "Private", min_capacity: 10, max_capacity: 20, minimum_spend: 8000000, status: "available", amenities: ["wifi", "tv", "sound_system"] },
];

const typeIcons: Record<ItemType, React.ElementType> = {
  table: Grid,
  sofa: Armchair,
  room: DoorOpen,
  booth: Grid,
  vip: Users,
};

const statusColors: Record<ItemStatus, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-green-500/20", text: "text-green-400", label: "Available" },
  booked: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Booked" },
  occupied: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Occupied" },
  maintenance: { bg: "bg-red-500/20", text: "text-red-400", label: "Maintenance" },
  closed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Closed" },
};

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  tv: Tv,
  sound_system: Music,
};

/**
 * Inventory Management Page
 */
export default function InventoryPage() {
  const [items, setItems] = useState(mockInventory);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    const result = await updateInventoryStatus(itemId, newStatus);
    if (result.success) {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">Table & Room Inventory</h1>
          <p className="text-white/60">Manage venue capacity and availability</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[#C026D3] text-white" : "text-white/60 hover:text-white"}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-[#C026D3] text-white" : "text-white/60 hover:text-white"}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(statusColors) as [ItemStatus, typeof statusColors[keyof typeof statusColors]][]).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
            className={`p-4 rounded-xl border transition-all ${
              filterStatus === status 
                ? "border-[#C026D3]/50 bg-[#C026D3]/10" 
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className={`text-2xl font-bold ${config.text}`}>
              {statusCounts[status] || 0}
            </div>
            <div className="text-sm text-white/60">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ItemType | "all")}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#C026D3]/50"
        >
          <option value="all">All Types</option>
          <option value="table">Tables</option>
          <option value="sofa">Sofas</option>
          <option value="booth">Booths</option>
          <option value="room">Rooms</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      {/* Inventory Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const TypeIcon = typeIcons[item.type];
              const statusConfig = statusColors[item.status];
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative p-4 bg-white/5 border rounded-2xl transition-all hover:border-[#C026D3]/30 cursor-pointer ${
                    item.status === "occupied" ? "border-amber-500/30" : 
                    item.status === "available" ? "border-green-500/30" : 
                    item.status === "maintenance" ? "border-red-500/30" : "border-white/10"
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${statusConfig.bg} ${statusConfig.text}`} />
                  
                  {/* Icon & Type */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-xs text-white/50 capitalize">{item.type}</p>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {item.location && (
                      <p className="text-white/60">{item.location}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Capacity</span>
                      <span className="text-white">{item.min_capacity}-{item.max_capacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Min. Spend</span>
                      <span className="text-[#C026D3] font-medium">
                        Rp {(item.minimum_spend / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    
                    {/* Amenities */}
                    {item.amenities.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {item.amenities.map((amenity) => {
                          const AmenityIcon = amenityIcons[amenity] || Wifi;
                          return (
                            <div key={amenity} className="p-1.5 bg-white/10 rounded-lg">
                              <AmenityIcon className="w-3 h-3 text-white/50" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                    {item.status !== "available" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(item.id, "available");
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Free
                      </button>
                    )}
                    {item.status === "available" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(item.id, "booked");
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        Book
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-white/70">Item</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Location</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Capacity</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Min. Spend</th>
                <th className="text-center p-4 text-sm font-medium text-white/70">Status</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const statusConfig = statusColors[item.status];
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          {(() => {
                            const IconComponent = typeIcons[item.type];
                            return IconComponent ? <IconComponent className="w-4 h-4 text-white/70" /> : null;
                          })()}
                        </div>
                        <span className="text-white font-medium">{item.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/60">{item.location || "-"}</td>
                    <td className="p-4 text-white">{item.min_capacity}-{item.max_capacity}</td>
                    <td className="p-4 text-[#C026D3]">Rp {(item.minimum_spend / 1000000).toFixed(1)}M</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(item.id, item.status === "available" ? "booked" : "available")}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <Armchair className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No inventory items found</p>
        </div>
      )}

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <InventoryDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Inventory Detail Modal
 */
function InventoryDetailModal({ 
  item, 
  onClose,
  onStatusChange 
}: { 
  item: InventoryItem; 
  onClose: () => void;
  onStatusChange: (id: string, status: ItemStatus) => void;
}) {
  const statusConfig = statusColors[item.status];
  const TypeIcon = typeIcons[item.type];

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
        className="w-full max-w-md bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <TypeIcon className="w-6 h-6 text-white/70" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{item.label}</h2>
                <p className="text-sm text-white/50 capitalize">{item.type} • {item.location}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className={`text-center py-3 rounded-xl ${statusConfig.bg}`}>
            <span className={`text-lg font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-white/50">Min Capacity</p>
              <p className="text-xl font-bold text-white">{item.min_capacity}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-white/50">Max Capacity</p>
              <p className="text-xl font-bold text-white">{item.max_capacity}</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-white/50">Minimum Spend</p>
            <p className="text-2xl font-bold text-[#C026D3]">
              Rp {(item.minimum_spend / 1000000).toFixed(1)}M
            </p>
          </div>

          {/* Quick Status Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {(["available", "booked", "occupied", "maintenance"] as ItemStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(item.id, status);
                  onClose();
                }}
                disabled={item.status === status}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  item.status === status
                    ? "bg-[#C026D3] text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {statusColors[status].label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
