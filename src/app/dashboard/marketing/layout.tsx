"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Percent, Image, Search, Users, LogOut, Sparkles, Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard/marketing", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/marketing/promos", label: "Promos", icon: Percent },
  { href: "/dashboard/marketing/gallery", label: "Gallery", icon: Image },
  { href: "/dashboard/marketing/seo", label: "SEO Tools", icon: Search },
];

/**
 * Marketing Dashboard Layout
 */
export default function MarketingDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-[#0A0A0F] border-r border-white/10 flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      <main className="md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Sparkles className="w-7 h-7 text-[#C026D3]" />
        <span className="font-syne font-bold text-xl text-white">
          Night<span className="text-[#C026D3]">Life</span>
        </span>
        <span className="ml-auto px-2 py-0.5 text-xs bg-[#C026D3]/20 text-[#C026D3] rounded-full">Marketing</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#C026D3]/20 to-[#9333EA]/20 text-white border border-[#C026D3]/30"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#C026D3]" : ""}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C026D3] to-[#9333EA] flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Marketing Team</p>
            <p className="text-xs text-white/50">Marketing</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
