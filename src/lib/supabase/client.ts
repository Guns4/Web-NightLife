import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Create and export Supabase client with proper types
 * Using any for database schema - will work when Supabase is configured
 */
export const supabase: SupabaseClient<any> | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
