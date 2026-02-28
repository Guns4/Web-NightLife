/**
 * =====================================================
 * TIER SELECTOR COMPONENT
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

'use client';

import { PromoTier } from '@/lib/services/promo-service';
import { TIER_PRICING } from '@/lib/services/promo-service';

interface TierSelectorProps {
  selectedTier: PromoTier;
  onSelect: (tier: PromoTier) => void;
  days?: number;
}

export default function TierSelector({ selectedTier, onSelect, days = 1 }: TierSelectorProps) {
  const tiers: PromoTier[] = ['basic', 'gold', 'platinum'];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const info = TIER_PRICING[tier];
        const isSelected = selectedTier === tier;
        const total = info.price * days;
        
        const tierStyles = {
          basic: {
            border: 'border-cyan-400/30 hover:border-cyan-400/60',
            glow: 'shadow-[0_0_30px_rgba(34,211,238,0.1)]',
            selected: 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]',
            gradient: 'from-cyan-900/20',
            icon: '💎',
          },
          gold: {
            border: 'border-amber-400/30 hover:border-amber-400/60',
            glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)]',
            selected: 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]',
            gradient: 'from-amber-900/20',
            icon: '🌟',
          },
          platinum: {
            border: 'border-purple-400/30 hover:border-purple-400/60',
            glow: 'shadow-[0_0_30px_rgba(168,85,247,0.1)]',
            selected: 'ring-2 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
            gradient: 'from-purple-900/20',
            icon: '✨',
          },
        };
        
        const styles = tierStyles[tier];
        
        return (
          <button
            key={tier}
            onClick={() => onSelect(tier)}
            className={`
              relative overflow-hidden rounded-2xl p-6
              bg-slate-900/80 backdrop-blur-xl
              border-2 transition-all duration-300
              ${styles.border} ${styles.glow}
              ${isSelected ? styles.selected : ''}
              hover:scale-[1.02]
              text-left
            `}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} to-transparent opacity-50`} />
            
            <div className="relative">
              {/* Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{styles.icon}</span>
                <div>
                  <h3 className={`text-xl font-bold capitalize ${tier === 'platinum' ? 'text-purple-400' : tier === 'gold' ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {info.name}
                  </h3>
                  <p className="text-sm text-slate-400">{info.boostScore}x Boost</p>
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{formatCurrency(total)}</span>
                <span className="text-slate-400 text-sm"> / {days} hari</span>
              </div>
              
              {/* Features */}
              <ul className="space-y-2">
                {info.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className={`w-4 h-4 ${tier === 'platinum' ? 'text-purple-400' : tier === 'gold' ? 'text-amber-400' : 'text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {/* Popular badge for gold */}
              {tier === 'gold' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              
              {/* Featured badge for platinum */}
              {tier === 'platinum' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
