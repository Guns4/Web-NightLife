'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  MapPin, 
  Music, 
  DollarSign,
  ChevronRight,
  Star,
  Loader2,
  Bot
} from 'lucide-react';
import { getConciergeRecommendations, rateConciergeSession } from '@/lib/actions/predictive-intelligence.actions';

interface ConciergeRecommendation {
  venue_id: string;
  venue_name: string;
  category: string;
  price_range: number;
  address: string;
  rating: number;
  match_score: number;
  reason: string;
  booking_link: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ConciergeRecommendation[];
  sessionId?: string;
}

const QUICK_PROMPTS = [
  { label: '🌙 Date night', query: 'I have a date night, looking for romantic spot' },
  { label: '🎉 Group hangout', query: 'Going with friends, want fun atmosphere' },
  { label: '🎵 Live music', query: 'Looking for live music and good drinks' },
  { label: '💆 Relax night', query: 'Chill vibes, want to unwind' }
];

export default function VibeConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm your Vibe Concierge 🎩\n\nTell me what you're in the mood for - like 'date night with good cocktails' or 'fun with friends who love RnB' - and I'll find the perfect spot for you!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getConciergeRecommendations(
        null, // No user ID for now
        input
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reasoning,
        recommendations: result.recommendations,
        sessionId: result.sessionId
      };

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble finding recommendations right now. Try again in a bit! 😔"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (query: string) => {
    setInput(query);
  };

  const handleRate = async (rating: number) => {
    if (sessionId) {
      await rateConciergeSession(sessionId, rating);
    }
    setIsOpen(false);
  };

  const getPriceRangeDisplay = (range: number) => {
    return '💎'.repeat(range);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Vibe Concierge</h3>
                  <p className="text-white/70 text-xs">AI-Powered Recommendations</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick picks:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(prompt.query)}
                      className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>

                    {/* Recommendations */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.recommendations.map((rec, i) => (
                          <a
                            key={i}
                            href={rec.booking_link}
                            className="block p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {i + 1}. {rec.venue_name}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full capitalize">
                                    {rec.category}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {rec.reason}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getPriceRangeDisplay(rec.price_range)}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {rec.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Rating prompt */}
                    {message.role === 'assistant' && message.sessionId && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRate(star)}
                              className="w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Star className="w-4 h-4 text-gray-300 hover:fill-yellow-400 hover:text-yellow-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Finding perfect spots...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tell me your vibe..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
