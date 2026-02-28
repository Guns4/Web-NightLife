/**
 * =====================================================
 * ADMIN SIDEBAR
 * Role-based navigation with SUPER_ADMIN only badges
 * =====================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  DollarSign, 
  Users, 
  Shield,
  MessageSquare,
  FileText,
  Star,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { isSuperAdmin, isAdmin, type Permission } from "@/lib/auth/rbac";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: "super_admin" | "admin";
  requiredPermission?: Permission;
}

// Navigation items
const SUPER_ADMIN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/super-admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Analytics",
    href: "/dashboard/super-admin/analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Transparency",
    href: "/dashboard/super-admin/transparency",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    label: "Financial Reports",
    href: "/admin/finance",
    icon: <DollarSign className="w-5 h-5" />,
    badge: "super_admin",
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
    badge: "super_admin",
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/ops",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Analytics",
    href: "/admin/bi",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Review Moderation",
    href: "/admin/reviews",
    icon: <Star className="w-5 h-5" />,
    requiredPermission: "APPROVE_REVIEWS",
  },
  {
    label: "Communications",
    href: "/admin/communications",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Health",
    href: "/admin/health",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];

const MODERATION_NAV: NavItem[] = [
  {
    label: "Moderation",
    href: "/admin/moderation",
    icon: <Shield className="w-5 h-5" />,
    badge: "admin",
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user.role;
  const userIsSuperAdmin = isSuperAdmin(role as any);
  const userIsAdmin = isAdmin(role as any);

  // Build navigation based on role
  const navItems: NavItem[] = [];

  if (userIsSuperAdmin) {
    navItems.push(...SUPER_ADMIN_NAV);
  } else if (userIsAdmin) {
    navItems.push(...ADMIN_NAV);
  }

  if (userIsAdmin) {
    navItems.push(...MODERATION_NAV);
  }

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 min-h-screen">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-black font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-white font-bold">AfterHours</h1>
            <p className="text-white/50 text-xs">Admin Portal</p>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="mb-6">
          {userIsSuperAdmin ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Super Admin</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Admin</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    item.badge === "super_admin"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {item.badge === "super_admin" ? "SA" : "ADM"}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Restricted Access Notice */}
        {!userIsSuperAdmin && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/50 text-xs">
              Some features are restricted to Super Admin access.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{user.fullName || user.email}</p>
            <p className="text-white/50 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
