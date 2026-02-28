/**
 * =====================================================
 * CREATE PROMO FORM
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { PromoTier } from '@/lib/services/promo-service';
import TierSelector from './TierSelector';
import { createPromo } from '@/lib/actions/promo.actions';

interface CreatePromoFormProps {
  venueId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreatePromoForm({ venueId, onSuccess, onCancel }: CreatePromoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tier, setTier] = useState<PromoTier>('basic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate days
  const days = startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;
  
  // Handle drag and drop
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // In production, upload to Cloudinary here
      // For now, use a placeholder URL
      setImageUrl(URL.createObjectURL(files[0]));
    }
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageUrl(URL.createObjectURL(files[0]));
    }
  }, []);
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title || !description || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createPromo({
        venueId,
        title,
        description,
        imageUrl: imageUrl || 'https://res.cloudinary.com/afterhoursid/image/upload/promos/default.jpg',
        tier,
        startDate,
        endDate,
        budget: 0, // Will be calculated on checkout
      });
      
      if (result.success && result.promo) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to create promo');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Promo Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Ladies Night Free Flow"
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
          required
        />
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your promo..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
          required
        />
      </div>
      
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Promo Image
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center
            transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-400/10' 
              : 'border-slate-700 hover:border-slate-600'
            }
          `}
        >
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Promo preview"
                className="max-h-48 mx-auto rounded-lg"
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-400 mb-2">
                Drag and drop your image here, or
              </p>
              <label className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                browse files
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>
      
      {/* Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-4">
          Choose Your Plan
        </label>
        <TierSelector
          selectedTier={tier}
          onSelect={setTier}
          days={days}
        />
      </div>
      
      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            required
          />
        </div>
      </div>
      
      {/* Duration Display */}
      {startDate && endDate && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Duration</span>
            <span className="text-white font-semibold">{days} day{days > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Promo'
          )}
        </button>
      </div>
    </form>
  );
}
