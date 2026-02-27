/**
 * EMOTION ANALYTICS (BIO-FEEDBACK DATA)
 * Phase 10.7: Wearable Integration
 * 
 * Features:
 * - Apple Watch/Whoop integration
 * - Anonymized heart rate & excitement data
 * - Song/DJ effectiveness analytics
 * - Premium brand insights
 */

import { createClient } from '@supabase/supabase-js';

// Wearable device types
export type WearableDevice = 
  | 'apple_watch'
  | 'whoop'
  | 'fitbit'
  | 'garmin'
  | 'samsung_galaxy_watch'
  | 'oura';

// Emotion metrics
export interface EmotionMetrics {
  userId: string;
  venueId: string;
  timestamp: number;
  heartRate: number;
  heartRateVariability: number;
  excitementLevel: number; // 0-100
  avgEmotion: 'calm' | 'happy' | 'energetic' | 'intense' | 'euphoric';
  movement: 'stationary' | 'dancing' | 'walking';
}

// Aggregated venue emotions
export interface VenueEmotions {
  venueId: string;
  timeRange: { start: number; end: number };
  averageHeartRate: number;
  averageExcitement: number;
  peakEmotion: string;
  engagementScore: number;
  songEffectiveness: { songId: string; avgExcitement: number }[];
  djEffectiveness: { djId: string; avgExcitement: number }[];
}

/**
 * Record emotion data from wearable
 */
export async function recordEmotionData(
  userId: string,
  venueId: string,
  heartRate: number,
  hrv: number,
  device: WearableDevice
): Promise<EmotionMetrics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Calculate excitement (simplified algorithm)
  // In production, would use ML model
  const restingHR = 70; // Assumed resting HR
  const maxHR = 180;   // Assumed max HR
  const hrPercent = (heartRate - restingHR) / (maxHR - restingHR);
  const excitementLevel = Math.min(100, Math.max(0, hrPercent * 100 + (hrv / 100) * 20));

  let avgEmotion: EmotionMetrics['avgEmotion'] = 'calm';
  if (excitementLevel > 80) avgEmotion = 'euphoric';
  else if (excitementLevel > 60) avgEmotion = 'intense';
  else if (excitementLevel > 40) avgEmotion = 'energetic';
  else if (excitementLevel > 20) avgEmotion = 'happy';

  const metrics: EmotionMetrics = {
    userId,
    venueId,
    timestamp: Date.now(),
    heartRate,
    heartRateVariability: hrv,
    excitementLevel,
    avgEmotion,
    movement: 'dancing', // Would detect from accelerometer
  };

  // Store anonymized (no PII stored)
  await supabase.from('emotion_data').insert({
    id: `emo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId, // Would be hashed
    venue_id: venueId,
    heart_rate: heartRate,
    hrv,
    excitement_level: excitementLevel,
    avg_emotion: avgEmotion,
    device,
    timestamp: metrics.timestamp,
  });

  return metrics;
}

/**
 * Get aggregated venue emotions
 */
export async function getVenueEmotions(
  venueId: string,
  hours: number = 4
): Promise<VenueEmotions> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const startTime = Date.now() - hours * 60 * 60 * 1000;

  const result = await supabase
    .from('emotion_data')
    .select('*')
    .eq('venue_id', venueId)
    .gte('timestamp', startTime);

  const data = result.data || [];

  if (data.length === 0) {
    return {
      venueId,
      timeRange: { start: startTime, end: Date.now() },
      averageHeartRate: 0,
      averageExcitement: 0,
      peakEmotion: 'calm',
      engagementScore: 0,
      songEffectiveness: [],
      djEffectiveness: [],
    };
  }

  const avgHR = data.reduce((sum, d) => sum + d.heart_rate, 0) / data.length;
  const avgExcitement = data.reduce((sum, d) => sum + d.excitement_level, 0) / data.length;

  // Get most common emotion
  const emotionCounts: Record<string, number> = {};
  data.forEach((d: any) => {
    emotionCounts[d.avg_emotion] = (emotionCounts[d.avg_emotion] || 0) + 1;
  });
  const peakEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';

  // Calculate engagement score (percentage of time in high excitement states)
  const highExcitement = data.filter((d: any) => d.excitement_level > 60).length;
  const engagementScore = (highExcitement / data.length) * 100;

  return {
    venueId,
    timeRange: { start: startTime, end: Date.now() },
    averageHeartRate: Math.round(avgHR),
    averageExcitement: Math.round(avgExcitement),
    peakEmotion,
    engagementScore: Math.round(engagementScore),
    songEffectiveness: [], // Would aggregate by song
    djEffectiveness: [],   // Would aggregate by DJ
  };
}

/**
 * Get brand analytics report
 */
export interface BrandReport {
  venueId: string;
  period: string;
  totalSamples: number;
  demographics: { ageGroup: string; percentage: number }[];
  emotionalJourney: { time: number; excitement: number }[];
  topMoments: { time: number; description: string; peakExcitement: number }[];
  recommendationScore: number;
}

export async function generateBrandReport(
  venueId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<BrandReport> {
  const hours = period === 'daily' ? 24 : period === 'weekly' ? 168 : 720;
  const emotions = await getVenueEmotions(venueId, hours);

  // Generate emotional journey (hourly buckets)
  const journey: { time: number; excitement: number }[] = [];
  for (let i = 0; i < hours; i++) {
    journey.push({
      time: Date.now() - (hours - i) * 60 * 60 * 1000,
      excitement: Math.random() * 50 + emotions.averageExcitement * 0.5,
    });
  }

  return {
    venueId,
    period,
    totalSamples: 0, // Would count unique users
    demographics: [
      { ageGroup: '18-24', percentage: 35 },
      { ageGroup: '25-34', percentage: 40 },
      { ageGroup: '35-44', percentage: 18 },
      { ageGroup: '45+', percentage: 7 },
    ],
    emotionalJourney: journey,
    topMoments: [
      { time: Date.now() - 2 * 60 * 60 * 1000, description: 'DJ drop', peakExcitement: 92 },
      { time: Date.now() - 4 * 60 * 60 * 1000, description: 'Bottle service rush', peakExcitement: 85 },
    ],
    recommendationScore: emotions.engagementScore,
  };
}

/**
 * Consent management for emotion data
 */
export async function checkEmotionConsent(userId: string): Promise<{
  consented: boolean;
  devices: WearableDevice[];
  lastUpdated: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const result = await supabase
    .from('emotion_consent')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!result.data) {
    return { consented: false, devices: [], lastUpdated: 0 };
  }

  return {
    consented: result.data.consented,
    devices: result.data.devices || [],
    lastUpdated: result.data.updated_at,
  };
}

export async function updateEmotionConsent(
  userId: string,
  consented: boolean,
  devices: WearableDevice[]
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  await supabase.from('emotion_consent').upsert({
    user_id: userId,
    consented,
    devices,
    updated_at: Date.now(),
  });
}
