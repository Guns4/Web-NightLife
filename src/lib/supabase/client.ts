import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client Configuration
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * For development, create a .env.local file with:
 * NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
 */

// TypeScript interface for Supabase environment variables
interface SupabaseEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Create and export Supabase client
 * Uses anonymous key for client-side operations
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<SupabaseEnv>(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
