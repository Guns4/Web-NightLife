/**
 * =====================================================
 * NEON PROMO CARD COMPONENT
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Promo, PromoTier } from '@/lib/services/promo-service';

interface NeonPromoCardProps {
  promo: Promo;
  showActions?: boolean;
  onActivate?: () => void;
  onPause?: () => void;
  onDelete?: () => void;
}

const tierColors: Record<PromoTier, { border: string; glow: string; badge: string }> = {
  basic: {
    border: 'border-cyan-400/50',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
  },
  gold: {
    border: 'border-amber-400/50',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
  },
  platinum: {
    border: 'border-purple-400/50',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
  },
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/50',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
  draft: 'bg-slate-500/20 text-slate-400 border-slate-400/50',
  expired: 'bg-red-500/20 text-red-400 border-red-400/50',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-400/50',
};

export default function NeonPromoCard({
  promo,
  showActions = false,
  onActivate,
  onPause,
  onDelete,
}: NeonPromoCardProps) {
  const colors = tierColors[promo.tier];
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl 
        bg-slate-900/80 backdrop-blur-xl
        border ${colors.border}
        ${colors.glow}
        transition-all duration-300 hover:scale-[1.02]
        group
      `}
    >
      {/* Background gradient */}
      <div className={`
        absolute inset-0 opacity-10
        bg-gradient-to-br ${promo.tier === 'platinum' ? 'from-purple-600' : promo.tier === 'gold' ? 'from-amber-600' : 'from-cyan-600'}
        to-transparent
      `} />
      
      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {promo.title}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2">
              {promo.description}
            </p>
          </div>
          
          {/* Tier Badge */}
          <span className={`
            px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
            ${colors.badge}
          `}>
            {promo.tier}
          </span>
        </div>
        
        {/* Image */}
        <div className="relative h-32 w-full rounded-lg overflow-hidden mb-3">
          <Image
            src={promo.imageUrl}
            alt={promo.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className={`
              px-2 py-1 rounded-md text-xs font-medium
              ${statusColors[promo.status]}
            `}>
              {promo.status}
            </span>
          </div>
          
          {/* Tier Badge Overlay */}
          {promo.tier === 'platinum' && (
            <div className="absolute bottom-2 left-2">
              <span className="px-2 py-1 rounded-md text-xs font-bold bg-purple-600/80 text-white">
                ✨ FEATURED
              </span>
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-cyan-400">{promo.impressions}</div>
            <div className="text-xs text-slate-500">Impressions</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-emerald-400">{promo.clicks}</div>
            <div className="text-xs text-slate-500">Clicks</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-amber-400">{promo.boostScore}x</div>
            <div className="text-xs text-slate-500">Boost</div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-400">
            <span>{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</span>
          </div>
          <div className="text-amber-400 font-semibold">
            {formatCurrency(promo.budget)}
          </div>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
            {promo.status === 'draft' && onActivate && (
              <button
                onClick={onActivate}
                className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
              >
                Activate
              </button>
            )}
            {promo.status === 'active' && onPause && (
              <button
                onClick={onPause}
                className="flex-1 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors text-sm font-medium"
              >
                Pause
              </button>
            )}
            {promo.status === 'paused' && onActivate && (
              <button
                onClick={onActivate}
                className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
              >
                Resume
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
