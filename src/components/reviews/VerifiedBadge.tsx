/**
 * =====================================================
 * VERIFIED GUEST BADGE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function VerifiedBadge({ size = 'md', showLabel = true }: VerifiedBadgeProps) {
  const sizes = {
    sm: { badge: 'w-4 h-4', icon: 'w-2.5 h-2.5', text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { badge: 'w-5 h-5', icon: 'w-3 h-3', text: 'text-xs', padding: 'px-2 py-1' },
    lg: { badge: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-sm', padding: 'px-3 py-1.5' },
  };
  
  const s = sizes[size];
  
  return (
    <span className={`
      inline-flex items-center gap-1 ${s.padding}
      bg-gradient-to-r from-amber-500/20 to-yellow-500/20
      border border-amber-400/50
      rounded-full
      ${s.text} font-semibold
      text-amber-400
      shadow-[0_0_10px_rgba(251,191,36,0.3)]
      animate-pulse
    `}>
      <svg 
        className={`${s.icon} text-amber-400`} 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      {showLabel && 'Verified Guest'}
    </span>
  );
}

/**
 * Verified Review Card Component
 */
interface VerifiedReviewCardProps {
  authorName: string;
  isVerified: boolean;
  verificationConfidence?: number;
  date: string;
  children: React.ReactNode;
}

export function VerifiedReviewCard({
  authorName,
  isVerified,
  verificationConfidence,
  date,
  children,
}: VerifiedReviewCardProps) {
  return (
    <div className="relative">
      {/* Verified indicator */}
      {isVerified && (
        <div className="absolute -top-2 -right-2">
          <VerifiedBadge size="sm" showLabel={false} />
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-white">{authorName}</span>
        {isVerified && <VerifiedBadge size="sm" />}
        <span className="text-slate-500 text-sm">• {date}</span>
      </div>
      
      {children}
    </div>
  );
}

/**
 * Trust Score Display
 */
interface TrustScoreProps {
  score: number;
  totalReviews: number;
  verifiedCount: number;
}

export function TrustScore({ score, totalReviews, verifiedCount }: TrustScoreProps) {
  const verifiedPercentage = totalReviews > 0 
    ? Math.round((verifiedCount / totalReviews) * 100) 
    : 0;
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
      <div className="text-center">
        <div className="text-3xl font-bold text-amber-400">{score.toFixed(1)}</div>
        <div className="text-xs text-slate-500">Trust Score</div>
      </div>
      
      <div className="h-12 w-px bg-slate-700" />
      
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Verified Reviews</span>
          <span className="text-emerald-400 font-medium">{verifiedPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${verifiedPercentage}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {verifiedCount} of {totalReviews} verified
        </div>
      </div>
    </div>
  );
}
