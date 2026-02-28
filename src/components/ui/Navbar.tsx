'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Bell, Search, LogOut } from 'lucide-react';

interface NavbarProps {
  isLoggedIn?: boolean;
  user?: {
    name: string;
    avatar?: string;
  };
}

export default function Navbar({ isLoggedIn = false, user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/discovery', label: 'Discover' },
    { href: '/events', label: 'Events' },
    { href: '/partners', label: 'Partners' },
    { href: '/guides', label: 'Guides' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark-void/80 backdrop-blur-xl border-b border-glass-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <span className="text-xl font-bold text-dark-obsidian">A</span>
            </div>
            <span className="text-xl font-bold hidden sm:block">
              <span className="text-white">After</span>
              <span className="neon-glow-cyan">Hours</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-cyan transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-neon-red rounded-full" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-dark-obsidian" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 glass-card py-2"
                      >
                        <div className="px-4 py-2 border-b border-glass-border">
                          <p className="text-white font-medium">{user?.name || 'User'}</p>
                          <p className="text-gray-400 text-sm">user@example.com</p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Settings
                        </Link>
                        <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-obsidian font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-void/95 backdrop-blur-xl border-t border-glass-border"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {!isLoggedIn && (
                <div className="pt-4 border-t border-glass-border space-y-3">
                  <Link
                    href="/auth/signin"
                    className="block py-2 text-center text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block py-2 text-center bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-obsidian font-semibold rounded-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
