'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (query: string, location: string, date: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery, location, date);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className="w-full h-full object-cover"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback gradient if video fails */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 50%, #0a0a0f 100%)',
          }}
        />
        
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse at 20% 80%, rgba(0, 245, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(191, 0, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(255, 0, 170, 0.1) 0%, transparent 70%)
            `,
            animation: 'gradient-shift 10s ease infinite',
          }}
        />
        
        {/* Dark mask */}
        <div className="absolute inset-0 bg-dark-obsidian/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <span className="text-white">Discover </span>
            <span className="neon-glow-cyan">Nightlife</span>
            <br />
            <span className="text-white">Like Never </span>
            <span className="neon-glow-purple">Before</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            From hidden speakeasies to rooftop bars — find your perfect night out in Indonesia's hottest venues.
          </motion.p>

          {/* Glassmorphism Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            <form 
              onSubmit={handleSearch}
              className="glass-card p-3 md:p-4 max-w-3xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search Input */}
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search venues, events, or vibes..."
                    className="w-full bg-dark-charcoal/50 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all"
                  />
                </div>

                {/* Location Input */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full bg-dark-charcoal/50 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all"
                  />
                </div>

                {/* Date Input */}
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-dark-charcoal/50 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="mt-4 w-full md:w-auto md:px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-obsidian font-bold rounded-xl hover:shadow-lg hover:shadow-neon-cyan/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Explore</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
          >
            {[
              { value: '500+', label: 'Venues' },
              { value: '50K+', label: 'Active Users' },
              { value: '100+', label: 'Events/Week' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold neon-glow-cyan">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-gray-500 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Keyframe for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
