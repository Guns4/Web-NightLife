/**
 * =====================================================
 * MULTI-STEP REVIEW FORM
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, Check, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { createReview } from '@/lib/actions/review.actions';

interface ReviewFormProps {
  venueId: string;
  userId?: string;
  userName?: string;
  venueLat?: number;
  venueLon?: number;
  onReviewSubmitted?: (reviewData: any) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const steps = [
  { id: 1, title: 'Rating', description: 'Rate your experience' },
  { id: 2, title: 'Photo', description: 'Upload a photo (optional)' },
  { id: 3, title: 'Receipt', description: 'Verify with receipt (optional)' },
];

export default function ReviewForm({ 
  venueId, 
  userId = 'anonymous',
  userName = 'Guest User', 
  venueLat,
  venueLon,
  onReviewSubmitted,
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Handle drag and drop for photos
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  }, []);
  
  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
    });
  };
  
  // Handle receipt drop
  const handleReceiptDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setReceiptImage(url);
    }
  }, []);
  
  // Navigation
  const canProceed = () => {
    if (step === 1) return rating > 0 && title.trim() && content.trim();
    if (step === 2) return true; // Optional
    if (step === 3) return true; // Optional
    return false;
  };
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Submit
  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await createReview(
        venueId,
        userId,
        userName,
        rating,
        title,
        content,
        images,
        receiptImage || undefined
      );
      
      if (result.success) {
        setSubmitted(true);
        onReviewSubmitted?.({
          rating,
          comment: content,
          isVerified: !!receiptImage,
          isAIVerified: false,
        });
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Review Submitted!</h3>
        <p className="text-slate-400 mb-6">
          {receiptImage 
            ? 'Your receipt is being verified. You\'ll receive a verified badge if approved.'
            : 'Add a receipt to get a verified badge!'
          }
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full font-semibold
              ${step > s.id 
                ? 'bg-emerald-500 text-white' 
                : step === s.id 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-800 text-slate-500'
              }
            `}>
              {step > s.id ? <Check className="w-5 h-5" /> : s.id}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${step > s.id ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-6"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">How was your experience?</h3>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Amazing nightlife experience!"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Add a Photo</h3>
              <p className="text-slate-400 text-sm">Share a moment from your visit (optional)</p>
              
              {/* Image Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${isDragging 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-400">
                      Drag photos here or{' '}
                      <label className="text-cyan-400 cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                        />
                      </label>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Verify with Receipt</h3>
              <p className="text-slate-400 text-sm">
                Upload a receipt to get a <span className="text-amber-400 font-semibold">Verified Guest</span> badge!
              </p>
              
              {/* Receipt Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleReceiptDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${isDragging 
                    ? 'border-amber-400 bg-amber-400/10' 
                    : 'border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                {receiptImage ? (
                  <div className="relative">
                    <img src={receiptImage} alt="Receipt" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      onClick={() => setReceiptImage('')}
                      className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-400">
                      Drag receipt here or{' '}
                      <label className="text-amber-400 cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setReceiptImage(URL.createObjectURL(file));
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {'We verify receipt date (< 24h) and location match'}
                    </p>
                  </>
                )}
              </div>
              
              {/* Info */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-1">Why verify?</p>
                  <p>Verified reviews get 3x more weight in ratings and earn you a cool badge!</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex gap-4">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
