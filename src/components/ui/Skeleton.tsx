"use client";

import { motion } from "framer-motion";

/**
 * SkeletonLoader Component
 * Provides loading placeholders with shimmer animation
 * Optimized for zero CLS (Cumulative Layout Shift)
 */

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

/**
 * Individual skeleton element with shimmer effect
 */
export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "bg-white/5 relative overflow-hidden";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    >
      {/* Shimmer animation overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

/**
 * Skeleton card for venue/venue listings
 */
export function VenueCardSkeleton() {
  return (
    <div className="bg-dark-navy/50 rounded-2xl overflow-hidden border border-white/5">
      <Skeleton height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={24} width="70%" />
        <Skeleton variant="text" height={16} width="40%" />
        <div className="flex gap-2">
          <Skeleton variant="text" height={28} width={80} />
          <Skeleton variant="text" height={28} width={80} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for hero section content
 */
export function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center space-y-4 max-w-2xl">
        <Skeleton variant="text" height={56} width="60%" className="mx-auto" />
        <Skeleton variant="text" height={24} width="80%" className="mx-auto" />
        <div className="flex gap-3 justify-center pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="circular" width={40} height={40} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for grid of cards
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VenueCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={20} width="60%" />
        <Skeleton variant="text" height={16} width="40%" />
      </div>
    </div>
  );
}
