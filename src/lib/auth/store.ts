/**
 * =====================================================
 * AUTH STORE - ZUSTAND STATE MANAGEMENT
 * Manages authentication state across the application
 * =====================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "GUEST" | "USER" | "OWNER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  venues?: Array<{
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  }>;
}

interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  
  // Async actions
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user directly
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),
      
      // Set error
      setError: (error) => set({ error }),
      
      // Login action
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        error: null 
      }),
      
      // Logout action
      logout: async () => {
        try {
          // Call logout API to revoke tokens
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Logout API error:", error);
        } finally {
          // Clear state regardless of API result
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        }
      },
      
      // Update user partial data
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      // Check authentication status
      checkAuth: async () => {
        const { isLoading } = get();
        if (isLoading) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // Try to refresh token
            await get().refreshAuth();
          }
        } catch (error) {
          console.error("Check auth error:", error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      // Refresh authentication using refresh token
      refreshAuth: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // Refresh failed, clear state
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error("Refresh auth error:", error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        // Only persist user info for UI, not sensitive tokens
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRoles: UserRole[]): boolean {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Hook to check if user can access admin routes
 */
export function useCanAccessAdmin(): boolean {
  return useHasRole(["ADMIN", "SUPER_ADMIN"]);
}

/**
 * Hook to check if user can access owner routes
 */
export function useCanAccessOwner(): boolean {
  return useHasRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);
}

/**
 * Get dashboard URL based on user role
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/super-admin";
    case "OWNER":
      return "/dashboard/owner";
    case "ADMIN":
      return "/dashboard/admin";
    case "USER":
      return "/dashboard";
    default:
      return "/";
  }
}
