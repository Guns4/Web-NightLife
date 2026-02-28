/**
 * =====================================================
 * PROMO CARD
 * High-conversion promo card with badges and countdown
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, Users, Flame, CheckCircle, Star } from "lucide-react";

interface Promo {
  id: string;
  title: string;
  description?: string;
  promoType: string;
  promoData?: any;
  imageUrl?: string;
  startDate: string | Date;
  endDate: string | Date;
  isFeatured?: boolean;
  venue?: {
    id: string;
    name: string;
    city: string;
    address?: string;
    category: string;
    isVerified?: boolean;
  };
  metrics?: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

interface PromoCardProps {
  promo: Promo;
  variant?: "default" | "compact" | "featured";
  showVenue?: boolean;
  onTrackImpression?: () => void;
}

// Badge types
const BADGES = {
  verified_visit: {
    label: "Verified Visit",
    color: "bg-green-500/20 border-green-500/40 text-green-400",
    icon: CheckCircle,
  },
  member_only: {
    label: "Member Only",
    color: "bg-purple-500/20 border-purple-500/40 text-purple-400",
    icon: Users,
  },
  hot_deal: {
    label: "Hot Deal",
    color: "bg-red-500/20 border-red-500/40 text-red-400",
    icon: Flame,
  },
};

// Countdown timer hook
function useCountdown(targetDate: string | Date) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// Format promo type to badge
function getPromoBadge(promo: Promo): string | null {
  if (promo.isFeatured) return "hot_deal";
  if (promo.promoType === "ladies_night") return "member_only";
  if (promo.promoType === "event") return "verified_visit";
  return null;
}

// Format promo type to display name
function getPromoTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    buy1get1: "Buy 1 Get 1",
    discount: "Discount",
    free_flow: "Free Flow",
    ladies_night: "Ladies Night",
    event: "Event",
    happy_hour: "Happy Hour",
    custom: "Special",
  };
  return labels[type] || type;
}

export default function PromoCard({ 
  promo, 
  variant = "default",
  showVenue = true,
  onTrackImpression,
}: PromoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const countdown = useCountdown(promo.endDate);
  const badge = getPromoBadge(promo);

  // Track impression on mount
  useEffect(() => {
    if (onTrackImpression) {
      const timer = setTimeout(onTrackImpression, 1000);
      return () => clearTimeout(timer);
    }
  }, [onTrackImpression]);

  const isExpiringSoon = !countdown.isExpired && 
    (countdown.hours < 24 || (countdown.hours === 0 && countdown.minutes < 60));

  return (
    <Link
      href={`/promo/${promo.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`block relative group ${
        variant === "compact" ? "" : "rounded-2xl overflow-hidden"
      }`}
    >
      {/* Gold Glow Border for Featured */}
      {(promo.isFeatured || badge === "hot_deal") && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-300 blur-sm" />
      )}

      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`relative bg-[#0a0a0a] border border-white/10 overflow-hidden ${
          variant === "compact" ? "rounded-xl" : "rounded-2xl"
        } ${
          promo.isFeatured || badge === "hot_deal" 
            ? "border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]" 
            : ""
        }`}
      >
        {/* Image */}
        <div className={`relative ${
          variant === "compact" ? "h-32" : "h-48 md:h-56"
        } overflow-hidden`}>
          {promo.imageUrl ? (
            <Image
              src={promo.imageUrl}
              alt={promo.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40" />
          )}
          
          {/* Aspect Ratio Container */}
          <div className="absolute inset-0 bg-[#0a0a0a]" />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

          {/* Promo Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white">
              {getPromoTypeLabel(promo.promoType)}
            </span>
          </div>

          {/* Dynamic Badges */}
          {badge && BADGES[badge as keyof typeof BADGES] && (
            <div className="absolute top-3 right-3">
              <span className={`flex items-center gap-1 px-2.5 py-1 backdrop-blur-sm rounded-full text-xs font-medium border ${BADGES[badge as keyof typeof BADGES].color}`}>
                {(() => {
                  const Icon = BADGES[badge as keyof typeof BADGES].icon;
                  return <Icon className="w-3 h-3" />;
                })()}
                {BADGES[badge as keyof typeof BADGES].label}
              </span>
            </div>
          )}

          {/* Countdown Timer */}
          {isExpiringSoon && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-white text-sm font-medium animate-pulse">
                <Clock className="w-4 h-4" />
                <span>
                  {countdown.hours > 0 
                    ? `${countdown.hours}h ${countdown.minutes}m left`
                    : `${countdown.minutes}m ${countdown.seconds}s left`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 ${variant === "compact" ? "p-3" : "p-5"}`}>
          {/* Title */}
          <h3 className={`font-bold text-white mb-2 line-clamp-1 ${
            variant === "compact" ? "text-sm" : "text-lg"
          }`}>
            {promo.title}
          </h3>

          {/* Description */}
          {promo.description && variant !== "compact" && (
            <p className="text-white/60 text-sm mb-3 line-clamp-2">
              {promo.description}
            </p>
          )}

          {/* Venue Info */}
          {showVenue && promo.venue && (
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {promo.venue.name}
                {promo.venue.city && ` • ${promo.venue.city}`}
              </span>
              {promo.venue.isVerified && (
                <Star className="w-3.5 h-3.5 text-green-400 fill-current flex-shrink-0" />
              )}
            </div>
          )}

          {/* Metrics */}
          {promo.metrics && variant !== "compact" && (
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span>{promo.metrics.views.toLocaleString()} views</span>
              {promo.metrics.ctr > 0 && (
                <span>{promo.metrics.ctr.toFixed(1)}% CTR</span>
              )}
            </div>
          )}

          {/* CTA */}
          <div className={`mt-4 ${
            variant === "compact" ? "mt-3" : ""
          }`}>
            <span className={`inline-flex items-center justify-center w-full py-2.5 ${
              variant === "compact" ? "py-2 text-sm" : "py-3"
            } bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition-all group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]`}>
              Claim Offer
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
