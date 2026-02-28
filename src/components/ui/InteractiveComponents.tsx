'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// =====================================================
// DRAG-TO-SCROLL CATEGORY PILLS
// =====================================================

interface CategoryPill {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface CategoryPillsProps {
  categories: CategoryPill[];
  selected?: string;
  onSelect?: (id: string) => void;
}

export function CategoryPills({ categories, selected, onSelect }: CategoryPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 200;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-dark-charcoal/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity ${
          showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } hover:bg-neon-cyan/20 hover:border hover:border-neon-cyan`}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => onSelect?.(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${
              selected === category.id
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-obsidian font-semibold'
                : 'glass border border-glass-border text-gray-300 hover:border-neon-cyan/50 hover:text-white'
            }`}
          >
            {category.icon}
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-dark-charcoal/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity ${
          showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } hover:bg-neon-purple/20 hover:border hover:border-neon-purple`}
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

// =====================================================
// SCROLL REVEAL ANIMATIONS
// =====================================================

interface RevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const directionVariants = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionVariants[direction] }}
      animate={isVisible ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// PARALLAX SCROLL EFFECT
// =====================================================

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({ children, speed = 0.5, className = '' }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const elementTop = rect.top + scrollY;
      const distance = scrollY - elementTop;
      setOffset(distance * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`relative ${className}`} style={{ transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
}

// =====================================================
// STAGGERED REVEAL FOR LISTS
// =====================================================

interface StaggeredRevealProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggeredReveal({ children, staggerDelay = 0.1, className = '' }: StaggeredRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// =====================================================
// HOVER CARD EFFECT
// =====================================================

interface HoverCardProps {
  children: ReactNode;
  className?: string;
}

export function HoverCard({ children, className = '' }: HoverCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useTransform(x, [-0.5, 0.5], [-15, 15]);
  const mouseY = useTransform(y, [-0.5, 0.5], [-15, 15]);

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      style={{ x: mouseX, y: mouseY }}
      whileHover={{ scale: 1.02 }}
      className={`glass-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// LIVE BADGE COMPONENT
// =====================================================

interface LiveBadgeProps {
  isLive?: boolean;
  className?: string;
}

export function LiveBadge({ isLive = true, className = '' }: LiveBadgeProps) {
  return (
    <div className={`live-badge ${!isLive ? 'offline' : ''} ${className}`}>
      <span>{isLive ? 'Live' : 'Offline'}</span>
    </div>
  );
}
