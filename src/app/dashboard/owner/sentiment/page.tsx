'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  Star,
  Calendar,
  Wrench,
  Users,
  Music,
  Coffee,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getVenueSentimentSummary, generateAISmartDiscount } from '@/lib/actions/predictive-intelligence.actions';

interface SentimentSummary {
  id: string;
  venue_id: string;
  period_start: string;
  period_end: string;
  avg_sentiment: number;
  total_reviews: number;
  sentiment_trend: 'improving' | 'stable' | 'declining';
  top_issues: { issue: string; count: number; severity: string }[];
  top_positives: { positive: string; count: number }[];
  weekly_action_plan: { action: string; priority: string; assigned_to: string }[];
}

export default function VoiceOfGuestPage() {
  const [summary, setSummary] = useState<SentimentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discountGenerating, setDiscountGenerating] = useState(false);

  // Mock venue ID
  const venueId = 'demo-venue-id';

  useEffect(() => {
    loadSummary();
  }, [venueId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getVenueSentimentSummary(venueId, 7);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const handleGenerateDiscount = async () => {
    setDiscountGenerating(true);
    try {
      await generateAISmartDiscount(venueId);
    } catch (error) {
      console.error('Failed to generate discount:', error);
    } finally {
      setDiscountGenerating(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-500';
    if (sentiment < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music': return <Music className="w-4 h-4" />;
      case 'service': return <Users className="w-4 h-4" />;
      case 'food': return <Coffee className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-pink-500" />
            Voice of the Guest
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-Powered Sentiment Analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDiscount}
            disabled={discountGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {discountGenerating ? 'Generating...' : 'AI Smart Discount'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !summary ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No sentiment data available yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Data will appear once customers start leaving reviews
          </p>
        </div>
      ) : (
        <>
          {/* Sentiment Score Card */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Overall Sentiment</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-4xl font-bold ${getSentimentColor(summary.avg_sentiment)}`}>
                      {summary.avg_sentiment > 0 ? '+' : ''}{(summary.avg_sentiment * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm text-gray-500">{getSentimentLabel(summary.avg_sentiment)}</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  summary.avg_sentiment > 0.3 ? 'bg-green-100 dark:bg-green-900/30' :
                  summary.avg_sentiment < -0.3 ? 'bg-red-100 dark:bg-red-900/30' :
                  'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  {summary.avg_sentiment > 0.3 ? (
                    <ThumbsUp className="w-8 h-8 text-green-500" />
                  ) : summary.avg_sentiment < -0.3 ? (
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  ) : (
                    <Minus className="w-8 h-8 text-yellow-500" />
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reviews Analyzed</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
                    {summary.total_reviews}
                  </p>
                </div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sentiment Trend</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(summary.sentiment_trend)}
                    <span className={`text-lg font-semibold capitalize ${
                      summary.sentiment_trend === 'improving' ? 'text-green-500' :
                      summary.sentiment_trend === 'declining' ? 'text-red-500' :
                      'text-gray-500'
                    }`}>
                      {summary.sentiment_trend}
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Weekly Action Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Weekly Action Plan
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  AI Generated
                </span>
              </div>
              <div className="p-4 space-y-3">
                {summary.weekly_action_plan.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No action items this week 🎉
                  </p>
                ) : (
                  summary.weekly_action_plan.map((action, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        action.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                        action.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-900/30'
                      }`}>
                        <Wrench className={`w-4 h-4 ${
                          action.priority === 'high' ? 'text-red-500' :
                          action.priority === 'medium' ? 'text-yellow-500' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Assigned to: {action.assigned_to}
                          </span>
                        </div>
                      </div>
                      <button className="text-green-600 hover:text-green-700">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Issues & Positives */}
            <div className="space-y-6">
              {/* Top Issues */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Top Issues
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {summary.top_issues.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No major issues detected
                    </p>
                  ) : (
                    summary.top_issues.map((issue, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            issue.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {issue.issue}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {issue.count}x
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Positives */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                    Top Positives
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {summary.top_positives.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No positive mentions yet
                    </p>
                  ) : (
                    summary.top_positives.map((positive, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {positive.positive}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {positive.count}x
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
