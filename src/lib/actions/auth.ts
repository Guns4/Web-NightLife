"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Role types for RBAC
 */
export type UserRole = 'guest' | 'owner' | 'marketing' | 'manager' | 'admin';

/**
 * Permission definitions by role
 */
export const rolePermissions: Record<UserRole, string[]> = {
  guest: [],
  owner: [
    'view_analytics',
    'manage_venue',
    'manage_promos',
    'manage_staff',
    'manage_billing',
    'manage_live_vibe',
    'view_guests',
    'manage_gallery',
    'manage_seo',
  ],
  marketing: [
    'view_analytics',
    'manage_promos',
    'manage_gallery',
    'manage_seo',
  ],
  manager: [
    'view_analytics',
    'manage_venue',
    'manage_live_vibe',
    'view_guests',
  ],
  admin: [
    'view_analytics',
    'manage_venue',
    'manage_promos',
    'manage_staff',
    'manage_billing',
    'manage_live_vibe',
    'view_guests',
    'manage_gallery',
    'manage_seo',
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Get dashboard route based on role
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return '/dashboard/owner';
    case 'marketing':
      return '/dashboard/marketing';
    case 'manager':
      return '/dashboard/ops';
    default:
      return '/';
  }
}

/**
 * Invite staff member
 */
export async function inviteStaffMember(
  email: string,
  role: UserRole,
  venueId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would:
    // 1. Create an invitation record in the database
    // 2. Send an email with the invitation link
    // 3. When they sign up, link their profile to the venue
    
    console.log(`Inviting ${email} as ${role} for venue ${venueId}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  venueId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would update the profile in Supabase
    console.log(`Updating user ${userId} to role ${newRole} for venue ${venueId}`);
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check role access for route
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  // Owner/Admin routes
  if (path.startsWith('/dashboard/owner') || path.startsWith('/dashboard/admin')) {
    return role === 'owner' || role === 'admin';
  }
  
  // Marketing routes
  if (path.startsWith('/dashboard/marketing')) {
    return role === 'marketing' || role === 'owner' || role === 'admin';
  }
  
  // Ops routes
  if (path.startsWith('/dashboard/ops')) {
    return role === 'manager' || role === 'owner' || role === 'admin';
  }
  
  return false;
}
