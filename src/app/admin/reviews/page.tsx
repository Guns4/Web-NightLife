/**
 * =====================================================
 * ADMIN MODERATION DASHBOARD
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Eye, 
  Search, 
  Filter,
  Image as ImageIcon,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { Review } from '@/lib/services/review-service';
import { fetchPendingReviews, adminApproveReview, adminRejectReview } from '@/lib/actions/review.actions';
import VerifiedBadge from '@/components/reviews/VerifiedBadge';

export default function ModerationDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Load reviews
  useEffect(() => {
    loadReviews();
  }, []);
  
  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle approve
  const handleApprove = async (reviewId: string) => {
    setProcessing(reviewId);
    try {
      await adminApproveReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setSelectedReview(null);
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(null);
    }
  };
  
  // Handle reject
  const handleReject = async (reviewId: string) => {
    setProcessing(reviewId);
    try {
      await adminRejectReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setSelectedReview(null);
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(null);
    }
  };
  
  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'flagged') return r.status === 'flagged';
    return true;
  });
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Review Moderation</h1>
          <p className="text-slate-400">Review and approve flagged reviews</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-bold text-amber-400">{reviews.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-slate-400">Pending Review</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-bold text-red-400">{reviews.filter(r => r.status === 'flagged').length}</div>
            <div className="text-sm text-slate-400">Flagged</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-bold text-emerald-400">{reviews.length}</div>
            <div className="text-sm text-slate-400">Total Queue</div>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'flagged', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Review List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No reviews to review
              </div>
            ) : (
              filteredReviews.map((review) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    p-4 rounded-xl bg-slate-900/50 border cursor-pointer transition-all
                    ${selectedReview?.id === review.id 
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                      : 'border-slate-800 hover:border-slate-700'
                    }
                  `}
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{review.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="text-sm text-slate-400">{review.userName}</span>
                        {review.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${review.status === 'flagged' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-amber-500/20 text-amber-400'
                      }
                    `}>
                      {review.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                    {review.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(review.createdAt)}
                    </span>
                    {review.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {review.images.length} photos
                      </span>
                    )}
                    {review.receiptImageUrl && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <ImageIcon className="w-3 h-3" />
                        Receipt attached
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Review Detail */}
          <div className="lg:sticky lg:top-6 h-fit">
            <AnimatePresence mode="wait">
              {selectedReview ? (
                <motion.div
                  key={selectedReview.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{selectedReview.title}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{selectedReview.userName}</span>
                        {selectedReview.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedReview.verificationStatus === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : selectedReview.verificationStatus === 'pending_review'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {selectedReview.verificationStatus}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Review</h3>
                    <p className="text-white">{selectedReview.content}</p>
                  </div>
                  
                  {/* Images */}
                  {selectedReview.images.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Photos</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedReview.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Receipt */}
                  {selectedReview.receiptImageUrl && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Receipt</h3>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                        <img 
                          src={selectedReview.receiptImageUrl} 
                          alt="Receipt" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {selectedReview.verificationConfidence && (
                        <p className="text-xs text-slate-500 mt-2">
                          Confidence: {(selectedReview.verificationConfidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => handleReject(selectedReview.id)}
                      disabled={processing === selectedReview.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReview.id)}
                      disabled={processing === selectedReview.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      Approve
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500">Select a review to view details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
