import Link from "next/link";
import { Sparkles, Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from "lucide-react";

/**
 * Footer Link type definition
 */
interface FooterLink {
  label: string;
  href: string;
}

/**
 * Footer Column type definition
 */
interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Footer columns configuration
 */
const footerColumns: FooterColumn[] = [
  {
    title: "Discover",
    links: [
      { label: "Venues", href: "/venues" },
      { label: "Experiences", href: "/experiences" },
      { label: "Events", href: "/events" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

/**
 * Social media links
 */
const socialLinks = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

/**
 * Footer Component
 * Professional dark grid aesthetic with navigation links
 */
export default function Footer() {
  return (
    <footer className="bg-dark-navy border-t border-white/10">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-primary/50 transition-colors" />
              </div>
              <span className="font-syne font-bold text-2xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                After<span className="text-primary">Hours</span><span className="text-gold">ID</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
              Your ultimate guide to premium nightlife experiences. 
              Discover the best venues, events, and entertainment in your city.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Bandung, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:hello@nightlife.app" className="hover:text-white transition-colors">
                  hello@nightlife.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+6289669094929" className="hover:text-white transition-colors">
                  +62 896 6909 4929
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-syne font-semibold text-white mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/60 text-sm hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Web3 Link - Fourth Column */}
          <div>
            <h3 className="font-syne font-semibold text-white mb-4">
              Web3
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/web3"
                  className="text-white/60 text-sm hover:text-primary transition-colors"
                >
                  Coming Soon
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges & Partner Logos */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Security Badges */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span>PCI Compliant</span>
              </div>
            </div>

            {/* Partner Logos - Horizontal scroll on mobile */}
            <div className="flex items-center gap-8 overflow-x-auto pb-2 md:pb-0">
              <span className="text-white/40 text-xs whitespace-nowrap">Partners:</span>
              <div className="flex items-center gap-6 grayscale opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-white/30 text-sm font-semibold">VENUE A</span>
                <span className="text-white/30 text-sm font-semibold">CLUB B</span>
                <span className="text-white/30 text-sm font-semibold">BAR C</span>
                <span className="text-white/30 text-sm font-semibold">LOUNGE D</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} NightLife. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-primary transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
