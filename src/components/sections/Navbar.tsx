"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Sparkles } from "lucide-react";

/**
 * Navbar Component
 * Transparent background with glassmorphism effect
 * Logo on left, navigation and login on right
 * Mobile responsive with hamburger menu
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-deep-black/90 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Fixed max-height 40px with object-contain */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8">
              <Sparkles className="w-full h-full text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-primary/50 transition-colors" />
            </div>
            <span className="font-syne font-bold text-xl md:text-2xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              After<span className="text-primary">Hours</span><span className="text-gold">ID</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              className="text-white/80 hover:text-white transition-colors text-sm font-medium min-h-[48px] px-4"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
            <button 
              className="relative px-6 py-2.5 rounded-full bg-gradient-premium-purple text-white font-medium text-sm overflow-hidden group min-h-[48px] flex items-center"
              aria-label="Get started with NightLife"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-primary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Mobile Menu Button - Touch target 48x48px min */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 text-white/80 hover:text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
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
              <div className="py-4 space-y-4 border-t border-white/10">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-white/80 hover:text-white transition-colors py-3 text-base font-medium min-h-[48px] flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 space-y-3 border-t border-white/10">
                  <button 
                    className="w-full text-left text-white/80 hover:text-white transition-colors py-3 text-base font-medium min-h-[48px] flex items-center"
                  >
                    Sign In
                  </button>
                  <button 
                    className="w-full px-6 py-4 rounded-full bg-gradient-premium-purple text-white font-medium min-h-[56px] flex items-center justify-center text-base"
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
