'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { getPredictedPeakTime } from '@/lib/actions/predictive-intelligence.actions';

interface PredictedPeakBadgeProps {
  venueId: string;
  compact?: boolean;
}

/**
 * AI Predicted Peak Time Badge
 * Shows when the venue is expected to be busiest
 */
export default function PredictedPeakBadge({ venueId, compact = false }: PredictedPeakBadgeProps) {
  const [peakData, setPeakData] = useState<{
    peak_time: string | null;
    occupancy: number;
    confidence: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const data = await getPredictedPeakTime(venueId);
        setPeakData(data);
      } catch (error) {
        console.error('Failed to fetch prediction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [venueId]);

  if (loading) {
    if (compact) {
      return <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />;
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!peakData || !peakData.peak_time) {
    return null;
  }

  const formatPeakTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'bg-red-500';
    if (occupancy >= 60) return 'bg-orange-500';
    if (occupancy >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getOccupancyLabel = (occupancy: number) => {
    if (occupancy >= 80) return 'Full';
    if (occupancy >= 60) return 'Busy';
    if (occupancy >= 40) return 'Moderate';
    return 'Quiet';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-purple-500" />
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
          {formatPeakTime(peakData.peak_time)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-full border border-purple-200 dark:border-purple-700">
      <div className="relative">
        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${getOccupancyColor(peakData.occupancy)}`} />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          Peak: {formatPeakTime(peakData.peak_time)}
        </span>
        <span className="text-[10px] text-purple-500 dark:text-purple-400">
          {getOccupancyLabel(peakData.occupancy)} ({peakData.occupancy}%)
        </span>
      </div>
      
      {peakData.confidence > 0 && (
        <div className="ml-1 flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600 dark:text-green-400">
            {Math.round(peakData.confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Live Occupancy Indicator
 * Shows current predicted occupancy level
 */
export function LiveOccupancyIndicator({ venueId }: { venueId: string }) {
  const [occupancy, setOccupancy] = useState<number>(50);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const data = await getPredictedPeakTime(venueId);
        if (data) {
          setOccupancy(data.occupancy);
        }
      } catch (error) {
        console.error('Failed to fetch occupancy:', error);
      }
    };

    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 300000); // Refresh every 5 min

    return () => clearInterval(interval);
  }, [venueId]);

  const getBarColor = (level: number) => {
    if (level >= 80) return 'bg-red-500';
    if (level >= 60) return 'bg-orange-500';
    if (level >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-gray-400" />
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(occupancy)}`}
          style={{ width: `${occupancy}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
        {occupancy}%
      </span>
    </div>
  );
}

/**
 * Smart Discount Badge
 * Shows when AI-generated discount is available
 */
export function SmartDiscountBadge({ discount }: { discount: { percentage: number; targetTier: string } }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
      <Sparkles className="w-3 h-3 text-white" />
      <span className="text-xs font-bold text-white">
        AI {discount.percentage}% OFF
      </span>
      <span className="text-[10px] text-white/80 capitalize">
        {discount.targetTier}
      </span>
    </div>
  );
}

// Import Sparkles for the badge
import { Sparkles } from 'lucide-react';
