/**
 * ORGANISM: Navigation
 * Main navigation component
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  User, 
  Menu, 
  X, 
  Sparkles,
  MapPin,
  Calendar,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface NavigationProps {
  user?: {
    name?: string;
    avatar?: string;
    role?: string;
  } | null;
  onMenuToggle?: () => void;
}

const navItems: NavItem[] = [
  { href: '/discovery', label: 'Discover', icon: <Search className="w-4 h-4" /> },
  { href: '/events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
  { href: '/vibe-index', label: 'Vibes', icon: <Sparkles className="w-4 h-4" /> },
  { href: '/partners', label: 'Partners', icon: <MapPin className="w-4 h-4" /> },
];

const userNavItems: NavItem[] = [
  { href: '/dashboard/owner', label: 'Dashboard' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
];

export function Navigation({ user, onMenuToggle }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">N</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">Nightlife.ID</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  pathname === item.href
                    ? 'text-yellow-500 bg-yellow-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block">{user.name}</span>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-lg py-2">
                    {userNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <hr className="my-2 border-gray-800" />
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                      onClick={() => {
                        // Handle logout
                        setUserMenuOpen(false);
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'text-yellow-500 bg-yellow-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
