'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, Check, X, Camera, Image, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ReviewFormProps {
  venueId: string;
  venueLat: number;
  venueLon: number;
  onReviewSubmitted?: (data?: {
    rating: number;
    comment: string;
    isVerified: boolean;
    isAIVerified: boolean;
  }) => void;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  verified: boolean;
}

const RADIUS_IN_METERS = 100; // Verification radius

export default function ReviewForm({ venueId, venueLat, venueLon, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [aiVerification, setAiVerification] = useState<{
    is_valid: boolean;
    confidence: number;
    message: string;
  } | null>(null);
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);
  
  // Geolocation state
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    verified: false
  });

  const handleVerifyLocation = () => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setGeoState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Import the calculateDistance function
        const { calculateDistance, isWithinVenueRadius } = await import('@/lib/utils/geo');
        
        const isValid = isWithinVenueRadius(latitude, longitude, venueLat, venueLon, RADIUS_IN_METERS);
        
        setGeoState({
          latitude,
          longitude,
          error: null,
          loading: false,
          verified: isValid
        });
        
        if (!isValid) {
          setError(`You are ${Math.round(calculateDistance(latitude, longitude, venueLat, venueLon))}m away from the venue. You need to be within ${RADIUS_IN_METERS}m to verify your visit.`);
        }
      },
      (err) => {
        let errorMessage = 'Unable to get location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setGeoState(prev => ({ ...prev, error: errorMessage, loading: false, verified: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache position for 1 minute
      }
    );
  };

  // Handle receipt file selection
  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
      setAiVerification(null);
      setReceiptUrl('');
    }
  };

  // Upload receipt to Cloudinary and verify with Vision AI
  const handleReceiptVerify = async () => {
    if (!receiptFile) return;
    
    setVerifyingReceipt(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', receiptFile);
      formData.append('upload_preset', 'reviews');
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const uploadData = await uploadResponse.json();
      const uploadedUrl = uploadData.secure_url;
      setReceiptUrl(uploadedUrl);
      
      // Call Vision AI for receipt verification
      const aiResponse = await fetch('/api/ai/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: uploadedUrl }),
      });
      
      const aiData = await aiResponse.json();
      setAiVerification(aiData);
      
    } catch (err) {
      console.error('Receipt verification error:', err);
      setAiVerification({
        is_valid: false,
        confidence: 0,
        message: 'Could not verify receipt. You can still submit your review.',
      });
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('You must be logged in to submit a review');
        setIsSubmitting(false);
        return;
      }

      // Submit the review
      const { data, error: insertError } = await supabase
        .from('vibe_checks')
        .insert({
          venue_id: venueId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
          user_latitude: geoState.latitude,
          user_longitude: geoState.longitude,
          is_verified_visit: geoState.verified,
          receipt_image_url: receiptUrl || null,
          ai_verification_confidence: aiVerification?.confidence || null,
          is_verified_purchase: aiVerification?.is_valid || false
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmitSuccess(true);
      setComment('');
      setRating(5);
      setGeoState({
        latitude: null,
        longitude: null,
        error: null,
        loading: false,
        verified: false
      });
      
      // Reset receipt state
      setReceiptFile(null);
      setReceiptPreview('');
      setReceiptUrl('');
      setAiVerification(null);

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted({
          rating,
          comment,
          isVerified: geoState.verified,
          isAIVerified: aiVerification?.is_valid || false
        });
      }

      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Share Your Vibe ✨
      </h3>

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <p className="text-green-700 dark:text-green-300 text-sm">
            🎉 Review submitted successfully!
            {geoState.verified && <span className="font-medium"> You verified your visit!</span>}
            {receiptUrl && aiVerification?.is_valid && <span className="font-medium"> & receipt verified!</span>}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Review (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience?"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Location Verification */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verify My Visit 📍
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get verified badge by checking in at the venue
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleVerifyLocation}
              disabled={geoState.loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                geoState.verified
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : geoState.loading
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-wait'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
            >
              {geoState.loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Getting location...
                </span>
              ) : geoState.verified ? (
                <span className="flex items-center gap-2">
                  ✓ Verified
                </span>
              ) : (
                'Verify Now'
              )}
            </button>
          </div>
          
          {geoState.error && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{geoState.error}</p>
          )}
          
          {geoState.verified && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✓ You're within {RADIUS_IN_METERS}m of the venue! Your review will be marked as verified.
            </p>
          )}
        </div>

        {/* Receipt Upload Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Receipt 🧾
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload your receipt for AI verification & bonus points
              </p>
            </div>
            
            {receiptFile && !receiptUrl && (
              <button
                type="button"
                onClick={handleReceiptVerify}
                disabled={verifyingReceipt}
                className="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                {verifyingReceipt ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify Receipt'
                )}
              </button>
            )}
          </div>
          
          {/* Receipt Preview */}
          {receiptPreview ? (
            <div className="relative mb-3">
              <img 
                src={receiptPreview} 
                alt="Receipt preview" 
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => {
                  setReceiptFile(null);
                  setReceiptPreview('');
                  setReceiptUrl('');
                  setAiVerification(null);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* AI Verification Result */}
              {aiVerification && (
                <div className={`absolute bottom-2 left-2 right-2 p-2 rounded-lg text-xs font-medium ${
                  aiVerification.is_valid 
                    ? 'bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-200' 
                    : 'bg-yellow-100 dark:bg-yellow-900/70 text-yellow-800 dark:text-yellow-200'
                }`}>
                  <span className="flex items-center gap-1">
                    {aiVerification.is_valid ? (
                      <><Check className="w-3 h-3" /> Verified ({Math.round(aiVerification.confidence * 100)}%)</>
                    ) : (
                      <><Image className="w-3 h-3" /> {aiVerification.message}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> receipt image
                </p>
              </div>
              <input 
                type="file" 
                id="receipt-upload"
                accept="image/*"
                onChange={handleReceiptSelect}
                className="hidden" 
              />
            </label>
          )}
          
          {receiptUrl && !aiVerification && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Receipt uploaded but not verified. Click "Verify Receipt" to verify.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
