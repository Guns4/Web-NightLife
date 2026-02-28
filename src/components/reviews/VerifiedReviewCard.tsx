/**
 * =====================================================
 * VERIFIED REVIEW CARD
 * Gold Border: Elite Verified (Struk + GPS)
 * Silver Border: Verified Visit (GPS Only)
 * =====================================================
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  MapPin, 
  ThumbsUp, 
  Flag, 
  CheckCircle, 
  Award,
  Clock,
  MoreHorizontal
} from "lucide-react";

interface VerifiedReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    gpsStatus: string;
    isEliteVerified: boolean;
    isVerifiedVisit: boolean;
    likesCount: number;
    reportsCount: number;
    createdAt: string;
    user: {
      id: string;
      fullName: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
  userLiked?: boolean;
  onLike: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
}

export default function VerifiedReviewCard({
  review,
  userLiked = false,
  onLike,
  onReport,
}: VerifiedReviewCardProps) {
  const [liked, setLiked] = useState(userLiked);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine verification level
  const isElite = review.isEliteVerified;
  const isVerified = review.isVerifiedVisit || review.gpsStatus === "MATCH";

  // Border styling based on verification level
  const borderClass = isElite
    ? "border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]" // Gold
    : isVerified
    ? "border-gray-400/40 shadow-[0_0_15px_rgba(156,163,175,0.15)]" // Silver
    : "border-white/10"; // Default

  const badgeClass = isElite
    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
    : "bg-gradient-to-r from-gray-400 to-gray-500 text-black";

  const handleLike = () => {
    setLiked(!liked);
    onLike(review.id);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Truncate comment if too long
  const shouldTruncate = (review.comment?.length || 0) > 200;
  const displayComment = isExpanded || !shouldTruncate
    ? review.comment
    : review.comment?.slice(0, 200) + "...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0a0a0a] border-2 ${borderClass} rounded-2xl p-5 relative overflow-hidden`}
    >
      {/* Elite Badge Glow Effect */}
      {isElite && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header: User + Rating + Verification Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-lg">
              {review.user.fullName?.[0] || review.user.displayName?.[0] || "?"}
            </div>

            <div>
              <h4 className="text-white font-medium">
                {review.user.fullName || review.user.displayName || "Anonymous"}
              </h4>
              <p className="text-white/50 text-sm">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>

          {/* Rating + Verification Badge */}
          <div className="flex items-center gap-3">
            {/* Verification Badge */}
            {isElite && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                <Award className="w-3 h-3" />
                Elite
              </div>
            )}
            {isVerified && !isElite && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                <CheckCircle className="w-3 h-3" />
                Verified
              </div>
            )}

            {/* Rating Stars */}
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="mb-4">
            <p className="text-white/80 leading-relaxed">
              {displayComment}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-amber-400 text-sm mt-1 hover:underline"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Verification Details */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isElite && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-lg">
              <Award className="w-3 h-3" />
              <span>Receipt + GPS Verified</span>
            </div>
          )}
          {isVerified && !isElite && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400/80 bg-gray-500/10 px-2 py-1 rounded-lg">
              <MapPin className="w-3 h-3" />
              <span>GPS Verified Location</span>
            </div>
          )}
          {review.gpsStatus === "MISMATCH" && (
            <div className="flex items-center gap-1.5 text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded-lg">
              <MapPin className="w-3 h-3" />
              <span>Location mismatch</span>
            </div>
          )}
        </div>

        {/* Footer: Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              liked
                ? "bg-amber-500/20 text-amber-400"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            {review.likesCount + (liked && !userLiked ? 1 : 0)}
          </button>

          {/* Report Button */}
          <div className="relative">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>

            {/* Report Dropdown */}
            {showReportMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#151515] border border-white/10 rounded-xl p-2 shadow-xl z-20">
                {["FAKE", "SPAM", "INAPPROPRIATE", "HARASSMENT"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => {
                      onReport(review.id);
                      setShowReportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                  >
                    {reason.charAt(0) + reason.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
