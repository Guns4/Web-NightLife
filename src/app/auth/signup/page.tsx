"use client";

 import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Neon Gold Sign Up Page
 * Premium registration with glassmorphism and gold accents
 */
export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Update auth store
      login(data.user);

      // Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    console.log("Signing up with Google...");
  };

  const handleAppleSignUp = () => {
    console.log("Signing up with Apple...");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects - Neon Gold */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#FFD700]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD700]/5 rounded-full blur-[180px]" />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-[#FFD700] transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#FFD700]/20 blur-xl rounded-full" />
            </div>
            <span className="font-syne font-bold text-3xl text-white">
              Night<span className="text-[#FFD700]">Life</span>
            </span>
          </Link>
        </div>

        {/* Glass Card with Gold Border */}
        <div className="relative group">
          {/* Gold border glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#FFD700] rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity blur-sm" />
          
          <div className="relative bg-[#0A0A0F]/80 backdrop-blur-xl rounded-3xl border border-[#FFD700]/30 p-8">
            <div className="text-center mb-6">
              <h1 className="font-syne font-bold text-2xl text-white mb-2">
                Create Account
              </h1>
              <p className="text-white/60">
                Join the NightLife community
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-gray-900 font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAppleSignUp}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors border border-[#FFD700]/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Sign up with Apple
              </motion.button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#FFD700]/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0A0A0F] text-[#FFD700]/60">or continue with email</span>
              </div>
            </div>

            {/* Email Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/50" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-[#FFD700]/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/50" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-[#FFD700]/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/50" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-[#FFD700]/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/50" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-[#FFD700]/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/50" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-[#FFD700]/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="terms"
                  className="w-4 h-4 mt-0.5 rounded bg-white/5 border-[#FFD700]/30 text-[#FFD700] focus:ring-[#FFD700] focus:ring-offset-0" 
                  required
                />
                <label htmlFor="terms" className="text-sm text-white/60">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#FFD700] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#FFD700] hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#FFD700] text-black font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="text-center text-white/60 mt-6">
              Already have an account?{" "}
              <Link 
                href="/auth/signin" 
                className="text-[#FFD700] hover:underline font-medium hover:text-[#D4AF37] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-white/40 hover:text-[#FFD700] text-sm transition-colors">
            ← Back to NightLife
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
