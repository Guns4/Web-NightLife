/**
 * Identity Service - Custom Layer over Supabase Auth
 * Provides user management, role-based access, and session handling
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface IdentityUser {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  role: 'GUEST' | 'USER' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN';
  isVerified: boolean;
  trustScore: number;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: IdentityUser;
  session?: Session;
  error?: string;
}

// Role hierarchy
const ROLE_HIERARCHY = {
  GUEST: 0,
  USER: 1,
  OWNER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

/**
 * Identity Service Class
 * Wraps Supabase Auth with additional features
 */
export class IdentityService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
  }

  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.fullName,
            role: 'USER',
            ...metadata
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userProfile = data.user ? await this.getUserProfile(data.user.id) : undefined;

      return {
        success: true,
        user: userProfile || undefined,
        session: data.session || undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update last login
      if (data.user) {
        await this.updateLastLogin(data.user.id);
      }

      const userProfile = data.user ? await this.getUserProfile(data.user.id) : undefined;

      return {
        success: true,
        user: userProfile ?? undefined,
        session: data.session || undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in with phone/OTP
   */
  async signInWithPhone(phone: string, otp: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userProfile = data.user ? await this.getUserProfile(data.user.id) : undefined;

      return {
        success: true,
        user: userProfile ?? undefined,
        session: data.session || undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in with OAuth (Google, Apple, Facebook)
   */
  async signInWithOAuth(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<IdentityUser | null> {
    const session = await this.getSession();
    if (!session?.user) return null;
    return this.getUserProfile(session.user.id);
  }

  /**
   * Get user profile from profiles table
   */
  async getUserProfile(userId: string): Promise<IdentityUser | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Fallback to auth user data
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user?.id === userId) {
        return {
          id: user.id,
          email: user.email || undefined,
          fullName: user.user_metadata?.full_name,
          avatarUrl: user.user_metadata?.avatar_url,
          role: (user.user_metadata?.role as any) || 'USER',
          isVerified: !!user.email_confirmed_at,
          trustScore: 50,
          createdAt: new Date(user.created_at)
        };
      }
      return null;
    }

    return {
      id: data.id,
      email: data.email || undefined,
      phone: data.phone || undefined,
      fullName: data.full_name || undefined,
      avatarUrl: data.avatar_url || undefined,
      role: data.role as any || 'USER',
      isVerified: data.is_verified || false,
      trustScore: data.trust_score || 50,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<IdentityUser>): Promise<AuthResult> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: await this.getUserProfile(userId) ?? undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, newRole: string): Promise<AuthResult> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || !this.hasRole(currentUser.role, 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(userRole: string, requiredRole: string): boolean {
    return ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >= 
           ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY];
  }

  /**
   * Verify user email - placeholder for email verification
   * Note: Actual implementation depends on Supabase email confirmation flow
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    // Email verification is typically handled by Supabase automatically
    // This is a placeholder for custom verification logic
    return { success: true };
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      });
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update password (after reset)
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await this.supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options?: { limit?: number; offset?: number; role?: string }): Promise<IdentityUser[]> {
    let query = this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.role) {
      query = query.eq('role', options.role);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) return [];

    return data.map(user => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role as any,
      isVerified: user.is_verified,
      trustScore: user.trust_score,
      createdAt: new Date(user.created_at)
    }));
  }
}

// Export singleton instance
export const identityService = new IdentityService();

// Helper function for server components
export async function getIdentityUser(): Promise<IdentityUser | null> {
  return identityService.getCurrentUser();
}

// Helper to require authentication
export async function requireAuth(): Promise<IdentityUser> {
  const user = await identityService.getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper to require specific role
export async function requireRole(requiredRole: string): Promise<IdentityUser> {
  const user = await requireAuth();
  if (!identityService.hasRole(user.role, requiredRole)) {
    throw new Error(`Role '${requiredRole}' required`);
  }
  return user;
}
