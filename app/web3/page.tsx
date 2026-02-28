"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/**
 * Web3 Coming Soon Page
 * Premium landing page with waitlist form
 * Features:
 * - Abstract 3D/Gradient background
 * - Large typography
 * - Email waitlist form
 * - Smooth animations
 */
export default function Web3Page() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      // Insert into waitlist
      const { error: insertError } = await supabase
        .from("waitlist_leads")
        .insert([{ email, source: "web3_page" }]);

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint violation - already registered
          setIsSuccess(true);
          return;
        }
        throw insertError;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Waitlist error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-deep-black relative overflow-hidden">
      {/* Abstract 3D/Gradient Background */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 blur-[150px]" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-black via-deep-black/80 to-deep-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-8"
        >
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-syne font-bold text-xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            After<span className="text-primary">Hours</span><span className="text-gold">ID</span>
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-syne font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center leading-tight tracking-[-0.02em] max-w-4xl"
        >
          The <span className="gradient-text">AfterHoursID</span> Protocol is Launching Soon.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl text-white/70 text-center max-w-2xl leading-relaxed"
        >
          Get on the Guestlist. Own a piece of the nightlife revolution. 
          NFT-powered membership, DAO governance, and exclusive token-gated experiences await.
        </motion.p>

        {/* Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 w-full max-w-md"
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
              <p className="text-white/60 text-center">
                We'll notify you when early access opens.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[56px]"
                  required
                  aria-label="Email address"
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(192,38,211,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Get Early Access</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-white/40 text-xs text-center">
                Join 2,000+ others waiting for early access. No spam, ever.
              </p>
            </form>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {[
            {
              title: "NFT Membership",
              desc: "Exclusive access tokens for premium venues",
            },
            {
              title: "DAO Governance",
              desc: "Shape the future of nightlife together",
            },
            {
              title: "Token Rewards",
              desc: "Earn $VIBE tokens for every visit",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-12 text-white/40 text-sm"
        >
          Questions?{" "}
          <a href="mailto:hello@nightlife.id" className="text-primary hover:underline">
            Contact us
          </a>
        </motion.p>
      </div>
    </main>
  );
}
