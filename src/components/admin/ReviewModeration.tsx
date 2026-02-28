/**
 * =====================================================
 * REVIEW MODERATION PANEL
 * Admin dashboard with shadow ban and auto-reply
 * =====================================================
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  AlertTriangle, 
  User,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { REJECTION_REASON_CODES, REJECTION_REASONS, type RejectionReasonCode } from "@/lib/services/reviews/review-service";

interface ReviewModerationPanelProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    isApproved: boolean;
    rejectionReasonCode: string | null;
    rejectionReason: string | null;
    user: {
      id: string;
      fullName: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      email: string;
      isShadowBanned: boolean;
    };
    venue: {
      id: string;
      name: string;
      city: string;
    };
    createdAt: string;
  };
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string, reasonCode: RejectionReasonCode, reason: string) => void;
  onShadowBan: (userId: string, banned: boolean) => void;
  isProcessing?: boolean;
}

export default function ReviewModerationPanel({
  review,
  onApprove,
  onReject,
  onShadowBan,
  isProcessing = false,
}: ReviewModerationPanelProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RejectionReasonCode | null>(null);
  const [customReason, setCustomReason] = useState("");

  const handleReject = () => {
    if (!selectedReason) return;
    
    const reason = customReason || REJECTION_REASONS[selectedReason];
    onReject(review.id, selectedReason, reason);
    setShowRejectModal(false);
    setSelectedReason(null);
    setCustomReason("");
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
            {review.user.fullName?.[0] || review.user.email[0].toUpperCase()}
          </div>
          
          <div>
            <h4 className="text-white font-medium">
              {review.user.fullName || review.user.displayName || "Anonymous"}
            </h4>
            <p className="text-white/50 text-sm">{review.user.email}</p>
          </div>
        </div>

        {/* Shadow Ban Toggle */}
        <button
          onClick={() => onShadowBan(review.user.id, !review.user.isShadowBanned)}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            review.user.isShadowBanned
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/20"
          }`}
        >
          <User className="w-4 h-4" />
          {review.user.isShadowBanned ? "Banned" : "Ban"}
        </button>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= review.rating ? "text-amber-400" : "text-white/20"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-white/50 text-sm">
            {review.venue.name} • {review.venue.city}
          </span>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="text-white/80">{review.comment}</p>
        )}

        {/* Status Badge */}
        {review.isApproved ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-xs">
            <Check className="w-3 h-3" /> Approved
          </span>
        ) : review.rejectionReasonCode ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-xs">
            <X className="w-3 h-3" /> Rejected: {review.rejectionReasonCode}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-yellow-400 text-xs">
            <AlertTriangle className="w-3 h-3" /> Pending
          </span>
        )}
      </div>

      {/* Actions */}
      {!review.isApproved && !review.rejectionReasonCode && (
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(review.id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Approve
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <X className="w-5 h-5" />
                Reject
              </>
            )}
          </button>
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <RejectModal
            selectedReason={selectedReason}
            customReason={customReason}
            onSelectReason={setSelectedReason}
            onCustomReasonChange={setCustomReason}
            onConfirm={handleReject}
            onCancel={() => {
              setShowRejectModal(false);
              setSelectedReason(null);
              setCustomReason("");
            }}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Reject Modal with Auto-Reply
 */
function RejectModal({
  selectedReason,
  customReason,
  onSelectReason,
  onCustomReasonChange,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  selectedReason: RejectionReasonCode | null;
  customReason: string;
  onSelectReason: (reason: RejectionReasonCode | null) => void;
  onCustomReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  const reasonCodes = Object.keys(REJECTION_REASON_CODES) as RejectionReasonCode[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-lg"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <X className="w-5 h-5 text-red-400" />
          Reject Review
        </h3>

        {/* Reason Selection */}
        <div className="mb-4">
          <label className="text-white/60 text-sm mb-2 block">Select Rejection Reason</label>
          <div className="grid grid-cols-2 gap-2">
            {reasonCodes.map((code) => (
              <button
                key={code}
                onClick={() => onSelectReason(code)}
                className={`px-3 py-2 rounded-lg text-left text-sm transition-all ${
                  selectedReason === code
                    ? "bg-red-500/20 border border-red-500/40 text-red-400"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {code.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason */}
        <div className="mb-6">
          <label className="text-white/60 text-sm mb-2 block">
            Custom Message (Auto-Reply to User)
          </label>
          <textarea
            value={customReason}
            onChange={(e) => onCustomReasonChange(e.target.value)}
            placeholder={selectedReason ? REJECTION_REASONS[selectedReason] : "Select a reason first..."}
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/40"
            disabled={!selectedReason}
          />
        </div>

        {/* Auto-Reply Preview */}
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <MessageSquare className="w-4 h-4" />
            Auto-Reply Preview
          </div>
          <p className="text-white/70 text-sm">
            Hi! Thank you for your review. Unfortunately, it couldn't be published because:{" "}
            <span className="text-white">
              {customReason || (selectedReason ? REJECTION_REASONS[selectedReason] : "...")}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedReason || isProcessing}
            className="flex-1 py-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Reject & Send
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
