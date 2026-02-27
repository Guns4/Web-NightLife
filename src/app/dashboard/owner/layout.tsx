"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Store, 
  Percent, 
  Users, 
  CreditCard, 
  Settings, 
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Sparkles
} from "lucide-react";

/**
 * Dashboard Sidebar Navigation Items
 */
const navItems = [
  { href: "/dashboard/owner", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/owner/venue", label: "Venue Profile", icon: Store },
  { href: "/dashboard/owner/promos", label: "Promo Manager", icon: Percent },
  { href: "/dashboard/owner/guests", label: "Guest List", icon: Users },
  { href: "/dashboard/owner/billing", label: "Billing & Ads", icon: CreditCard },
  { href: "/dashboard/owner/settings", label: "Settings", icon: Settings },
];

/**
 * Owner Dashboard Layout
 */
export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C026D3]" />
            <span className="font-syne font-bold text-lg text-white">
              Night<span className="text-[#C026D3]">Life</span>
            </span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-80 bg-[#0A0A0F] z-50 border-r border-white/10"
            >
              <SidebarContent 
                pathname={pathname} 
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-[#0A0A0F] border-r border-white/10 flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

/**
 * Sidebar Content Component
 */
function SidebarContent({ 
  pathname, 
  onClose 
}: { 
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-[#C026D3]" />
          <span className="font-syne font-bold text-xl text-white">
            Night<span className="text-[#C026D3]">Life</span>
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#C026D3]/20 to-[#9333EA]/20 text-white border border-[#C026D3]/30"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#C026D3]" : ""}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C026D3]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C026D3] to-[#9333EA] flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-white/50">Venue Owner</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
