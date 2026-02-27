"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, TrendingUp, Users, Calendar, 
  Percent, Settings, User, Building, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  category: "promo" | "venue" | "guest" | "staff" | "settings" | "analytics";
}

interface CommandKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Global Command+K Search Modal
 */
export default function CommandKModal({ isOpen, onClose }: CommandKModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const allItems: SearchResult[] = [
    // Analytics
    { id: "1", title: "Analytics Overview", description: "View revenue and performance metrics", icon: TrendingUp, action: "/dashboard/owner", category: "analytics" },
    { id: "2", title: "Revenue Attribution", description: "Track leads and bookings", icon: TrendingUp, action: "/dashboard/owner", category: "analytics" },
    { id: "3", title: "Peak Hours", description: "View peak hour predictions", icon: TrendingUp, action: "/dashboard/owner", category: "analytics" },
    
    // Promos
    { id: "4", title: "Promos", description: "Manage your promotions", icon: Percent, action: "/dashboard/marketing/promos", category: "promo" },
    { id: "5", title: "A/B Testing", description: "Create and manage promo tests", icon: Percent, action: "/dashboard/marketing/promos", category: "promo" },
    { id: "6", title: "Social Posts", description: "Cross-post to social media", icon: Percent, action: "/dashboard/marketing", category: "promo" },
    
    // Guests
    { id: "7", title: "VIP Guests", description: "Manage high-value guests", icon: Users, action: "/dashboard/ops", category: "guest" },
    { id: "8", title: "Blacklist", description: "View flagged guests", icon: Users, action: "/dashboard/ops", category: "guest" },
    { id: "9", title: "Leads", description: "View and manage leads", icon: Users, action: "/dashboard/ops", category: "guest" },
    
    // Reservations
    { id: "10", title: "Reservations", description: "Manage bookings", icon: Calendar, action: "/dashboard/ops/reservations", category: "venue" },
    { id: "11", title: "Queue", description: "View queue management", icon: Calendar, action: "/dashboard/ops/queues", category: "venue" },
    
    // Settings
    { id: "12", title: "Settings", description: "Venue settings", icon: Settings, action: "/dashboard/owner/settings", category: "settings" },
    { id: "13", title: "Staff", description: "Manage team members", icon: User, action: "/dashboard/ops/staff", category: "staff" },
    { id: "14", title: "Venue Profile", description: "Edit venue details", icon: Building, action: "/dashboard/owner/settings", category: "settings" },
  ];

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(allItems.slice(0, 8));
      return;
    }

    const filtered = allItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
  }, [allItems]);

  useEffect(() => {
    search(query);
  }, [query, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          // This would be triggered from parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.action);
    onClose();
    setQuery("");
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const categoryLabels: Record<string, string> = {
    analytics: "Analytics",
    promo: "Promotions",
    guest: "Guest Management",
    venue: "Reservations",
    settings: "Settings",
    staff: "Team",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="relative w-full max-w-2xl bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search className="w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search promos, guests, analytics..."
              className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-lg"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-white/40">
              <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#C026D3]/20 transition-colors">
                            <item.icon className="w-5 h-5 text-white/60 group-hover:text-[#C026D3] transition-colors" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{item.title}</p>
                            <p className="text-sm text-white/40">{item.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#C026D3] transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                to select
              </span>
            </div>
            <span>NightLife Command Center</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to trigger Command+K modal
 */
export function useCommandK() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
