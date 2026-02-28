/**
 * =====================================================
 * SENTIMENT ANALYSIS WIDGET
 * Owner Dashboard - Rating Trends & Keyword Analysis
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageSquare,
  Award,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface SentimentData {
  averageRating: number;
  totalReviews: number;
  ratingTrend: { date: string; avgRating: number }[];
  keywords: { word: string; count: number }[];
  verifiedRatio: number;
}

interface SentimentAnalysisWidgetProps {
  venueId: string;
  venueName: string;
}

export default function SentimentAnalysisWidget({
  venueId,
  venueName,
}: SentimentAnalysisWidgetProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "trends">("overview");

  useEffect(() => {
    fetchSentimentData();
  }, [venueId]);

  const fetchSentimentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/venues/${venueId}/sentiment`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch sentiment data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rating trend direction
  const getTrendDirection = () => {
    if (!data?.ratingTrend || data.ratingTrend.length < 2) return null;
    const recent = data.ratingTrend[data.ratingTrend.length - 1]?.avgRating || 0;
    const previous = data.ratingTrend[data.ratingTrend.length - 2]?.avgRating || 0;
    const diff = recent - previous;
    
    if (diff > 0.1) return "up";
    if (diff < -0.1) return "down";
    return "stable";
  };

  const trend = getTrendDirection();

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-white/10 rounded-xl" />
            <div className="h-20 bg-white/10 rounded-xl" />
            <div className="h-20 bg-white/10 rounded-xl" />
          </div>
          <div className="h-40 bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">No sentiment data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Sentiment Analysis
          </h3>
          <p className="text-white/50 text-sm">{venueName}</p>
        </div>
        <button
          onClick={fetchSentimentData}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(["overview", "keywords", "trends"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                : "text-white/60 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Average Rating */}
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.averageRating.toFixed(1)}</p>
                <p className="text-white/50 text-xs">Avg Rating</p>
              </div>

              {/* Total Reviews */}
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.totalReviews}</p>
                <p className="text-white/50 text-xs">Total Reviews</p>
              </div>

              {/* Verified Ratio */}
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Award className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.verifiedRatio}%</p>
                <p className="text-white/50 text-xs">Verified</p>
              </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${
                trend === "up" ? "bg-green-500/10" : trend === "down" ? "bg-red-500/10" : "bg-white/5"
              }`}>
                {trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <BarChart3 className="w-5 h-5 text-white/60" />
                )}
                <span className={`text-sm font-medium ${
                  trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-white/60"
                }`}>
                  {trend === "up" ? "Trending Up" : trend === "down" ? "Trending Down" : "Stable"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === "keywords" && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm mb-4">Most mentioned words in reviews</p>
            
            {data.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((keyword, index) => (
                  <motion.div
                    key={keyword.word}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                  >
                    <span className="text-white">{keyword.word}</span>
                    <span className="text-amber-400 text-sm font-medium">×{keyword.count}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">No keywords extracted yet</p>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm mb-4">Weekly rating trend (last 4 weeks)</p>
            
            {data.ratingTrend.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-32">
                {data.ratingTrend.map((item, index) => {
                  const height = (item.avgRating / 5) * 100;
                  return (
                    <div key={item.date} className="flex-1 flex flex-col items-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className={`w-full rounded-t-lg ${
                          index === data.ratingTrend.length - 1
                            ? "bg-gradient-to-t from-amber-500 to-amber-400"
                            : "bg-white/20"
                        }`}
                      />
                      <span className="text-white/40 text-xs mt-2">
                        {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">Not enough data for trends</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
