"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Sparkles } from "lucide-react";

/**
 * Navbar Component - Gold Neon Futuristic Design
 * Floating glassmorphic bar with gold glow border
 * Staggered slide-down entry animation for nav items
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect - triggers glassmorphism after 20px
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links
  const navLinks = [
    { href: "/discovery", label: "Discover" },
    { href: "/events", label: "Events" },
    { href: "/web3", label: "Web3" },
    { href: "/about", label: "About" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "navbar-glass navbar-gold-glow"
          : "bg-transparent"
      }`}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Fixed max-height 40px with object-contain */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-8 w-8">
                <Sparkles className="w-full h-full text-gold-premium transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 blur-lg bg-gold-premium/30 group-hover:bg-gold-premium/50 transition-colors" />
              </div>
              <span className="font-syne font-bold text-xl md:text-2xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(199,164,15,0.5)]">
                After<span className="text-gold-premium">Hours</span><span className="text-gold-premium">ID</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1 + i * 0.1, 
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94] as const,
                }}
              >
                <Link
                  href={link.href}
                  className="text-white/80 hover:text-gold-premium transition-colors duration-200 text-sm font-medium tracking-wide relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-premium transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_10px_rgba(199,164,15,0.5)]" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop Auth Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden md:flex items-center gap-4"
          >
            <button 
              className="text-white/80 hover:text-gold-premium transition-colors text-sm font-medium min-h-[48px] px-4 btn-haptic"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
            <button 
              className="relative px-6 py-2.5 rounded-full bg-gradient-gold-premium text-black font-medium text-sm overflow-hidden group min-h-[48px] flex items-center btn-magnetic btn-haptic"
              aria-label="Get started with NightLife"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gold-premium-light opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </motion.div>

          {/* Mobile Menu Button - Touch target 48x48px min */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 text-white/80 hover:text-gold-premium transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Smooth slide-in */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4 border-t border-gold-premium/20">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className="block text-white/80 hover:text-gold-premium transition-colors py-3 text-base font-medium min-h-[48px] flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 space-y-3 border-t border-gold-premium/20">
                  <button 
                    className="w-full text-left text-white/80 hover:text-gold-premium transition-colors py-3 text-base font-medium min-h-[48px] flex items-center"
                  >
                    Sign In
                  </button>
                  <button 
                    className="w-full px-6 py-4 rounded-full bg-gradient-gold-premium text-black font-medium min-h-[56px] flex items-center justify-center text-base btn-haptic"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
