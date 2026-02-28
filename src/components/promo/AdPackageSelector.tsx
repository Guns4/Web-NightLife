/**
 * =====================================================
 * AD PACKAGE SELECTOR
 * Package selector for Merchant Portal with Gold/Silver/Bronze tiers
 * =====================================================
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, Clock, ChevronRight } from "lucide-react";
import { formatPrice, calculateAdPrice, type AdSlotType } from "@/lib/pricing/dynamic-pricing";

interface AdPackageSelectorProps {
  venueId: string;
  venueCity?: string;
  merchantSignupDate?: string;
  onSelectPackage?: (tier: AdTier, price: number) => void;
  selectedTier?: AdTier;
}

type AdTier = "homepage_banner" | "top_search" | "featured_card";

interface PackageTier {
  id: AdTier;
  name: string;
  tier: "gold" | "silver" | "bronze";
  description: string;
  features: string[];
  basePrice: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const PACKAGE_TIERS: PackageTier[] = [
  {
    id: "homepage_banner",
    name: "Homepage Banner",
    tier: "gold",
    description: "Maximum visibility at the top of homepage",
    features: [
      "Top 3 positions on homepage",
      "Hero slider inclusion",
      "Priority in search results",
      "Maximum impressions",
      "Premium badge",
    ],
    basePrice: 300000,
    icon: <Crown className="w-8 h-8" />,
    popular: true,
  },
  {
    id: "top_search",
    name: "Top Search",
    tier: "silver",
    description: "Featured at the top of search results",
    features: [
      "Top of search results",
      "Injected every 5 venues",
      "Higher visibility",
      "Category highlighting",
    ],
    basePrice: 200000,
    icon: <Zap className="w-8 h-8" />,
  },
  {
    id: "featured_card",
    name: "Featured Card",
    tier: "bronze",
    description: "Highlighted venue card in listings",
    features: [
      "Featured badge",
      "Gold border highlight",
      "Priority listing",
      "Basic analytics",
    ],
    basePrice: 150000,
    icon: <Star className="w-8 h-8" />,
  },
];

// Color mappings for tiers
const TIER_STYLES = {
  gold: {
    gradient: "from-amber-400 via-amber-500 to-amber-600",
    border: "border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.3)]",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    badge: "bg-amber-500",
  },
  silver: {
    gradient: "from-gray-300 via-gray-400 to-gray-500",
    border: "border-gray-400/50",
    glow: "shadow-[0_0_20px_rgba(156,163,175,0.2)]",
    bg: "bg-gray-400/10",
    text: "text-gray-300",
    badge: "bg-gray-400",
  },
  bronze: {
    gradient: "from-orange-400 via-orange-500 to-orange-600",
    border: "border-orange-500/50",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.2)]",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    badge: "bg-orange-500",
  },
};

export default function AdPackageSelector({
  venueId,
  venueCity = "Jakarta",
  merchantSignupDate,
  onSelectPackage,
  selectedTier,
}: AdPackageSelectorProps) {
  const [selected, setSelected] = useState<AdTier | null>(selectedTier || null);
  const [duration, setDuration] = useState(7);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const handleSelect = async (tier: AdTier) => {
    setSelected(tier);
    setCalculatingPrice(true);

    try {
      // Calculate price using the pricing engine
      const dates = Array.from({ length: duration }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split("T")[0];
      });

      const priceBreakdown = await calculateAdPrice(
        venueId,
        tier as AdSlotType,
        dates,
        venueCity,
        merchantSignupDate
      );

      setCalculatedPrice(priceBreakdown.totalAfterDiscount);

      if (onSelectPackage) {
        onSelectPackage(tier, priceBreakdown.totalAfterDiscount);
      }
    } catch (error) {
      console.error("Failed to calculate price:", error);
      // Fallback to base price
      const tierInfo = PACKAGE_TIERS.find((p) => p.id === tier);
      if (tierInfo) {
        setCalculatedPrice(tierInfo.basePrice * duration);
      }
    } finally {
      setCalculatingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Duration Selector */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className="text-white/60">Duration:</span>
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setDuration(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                duration === days
                  ? "bg-amber-500 text-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGE_TIERS.map((packageTier, index) => {
          const styles = TIER_STYLES[packageTier.tier];
          const isSelected = selected === packageTier.id;

          return (
            <motion.div
              key={packageTier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative cursor-pointer group ${
                isSelected ? "ring-2 ring-amber-400" : ""
              }`}
              onClick={() => handleSelect(packageTier.id)}
            >
              {/* Glow Effect for Selected */}
              {isSelected && (
                <div className={`absolute -inset-0.5 ${styles.glow} rounded-2xl blur-sm`} />
              )}

              {/* Popular Badge */}
              {packageTier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full p-6 bg-[#0a0a0a] border rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? `${styles.border} ${styles.glow}`
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Tier Icon */}
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    isSelected ? styles.bg : "bg-white/5"
                  } ${isSelected ? styles.text : "text-white/60"}`}
                >
                  {packageTier.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  {packageTier.name}
                </h3>

                {/* Description */}
                <p className="text-white/50 text-sm text-center mb-4">
                  {packageTier.description}
                </p>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold ${styles.text}`}>
                    {formatPrice(packageTier.basePrice)}
                  </div>
                  <div className="text-white/40 text-sm">per day</div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {packageTier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className={`w-4 h-4 mt-0.5 ${styles.text} flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isSelected
                      ? `bg-gradient-to-r ${styles.gradient} text-black`
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-5 h-5" />
                      Selected
                    </>
                  ) : (
                    <>
                      Select Plan
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Price Summary */}
      {selected && calculatedPrice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-[#0a0a0a] border border-amber-500/30 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white mb-1">
                {PACKAGE_TIERS.find((p) => p.id === selected)?.name}
              </h4>
              <p className="text-white/50 text-sm">
                {duration} days • {venueCity}
              </p>
            </div>
            <div className="text-right">
              {calculatingPrice ? (
                <div className="flex items-center gap-2 text-white/50">
                  <Clock className="w-5 h-5 animate-spin" />
                  Calculating...
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    {formatPrice(calculatedPrice)}
                  </div>
                  <div className="text-white/40 text-sm">Total</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
