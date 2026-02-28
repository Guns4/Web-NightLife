/**
 * =====================================================
 * GRANULAR RBAC SYSTEM
 * AfterHoursID - Permission-Based Access Control
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Permission Types
export type Permission =
  | 'READ_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'READ_VENUE'
  | 'CREATE_VENUE'
  | 'UPDATE_VENUE'
  | 'DELETE_VENUE'
  | 'READ_PROMO'
  | 'CREATE_PROMO'
  | 'UPDATE_PROMO'
  | 'DELETE_PROMO'
  | 'PUBLISH_PROMO'
  | 'READ_REVIEW'
  | 'CREATE_REVIEW'
  | 'MODERATE_REVIEW'
  | 'READ_RESERVATION'
  | 'CREATE_RESERVATION'
  | 'UPDATE_RESERVATION'
  | 'CANCEL_RESERVATION'
  | 'READ_PARTNER'
  | 'CREATE_PARTNER'
  | 'MANAGE_PARTNER'
  | 'ACCESS_ADMIN'
  | 'ACCESS_SUPER_ADMIN'
  | 'MANAGE_USERS'
  | 'VIEW_ANALYTICS'
  | 'READ_MEMBERSHIP'
  | 'MANAGE_MEMBERSHIP'
  | 'PROCESS_PAYMENT'
  | 'REFUND_PAYMENT'
  | 'VIEW_PAYMENTS';

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  GUEST: ['READ_VENUE', 'READ_PROMO', 'READ_REVIEW'],
  
  USER: [
    'READ_USER', 'UPDATE_USER', 'READ_VENUE', 'READ_PROMO',
    'CREATE_REVIEW', 'CREATE_RESERVATION', 'READ_RESERVATION', 'READ_MEMBERSHIP'
  ],
  
  VENUE_MANAGER: [
    'READ_USER', 'READ_VENUE', 'UPDATE_VENUE', 'READ_PROMO',
    'CREATE_PROMO', 'UPDATE_PROMO', 'DELETE_PROMO', 'READ_RESERVATION',
    'UPDATE_RESERVATION', 'READ_REVIEW'
  ],
  
  ADMIN: [
    'READ_USER', 'UPDATE_USER', 'READ_VENUE', 'CREATE_VENUE', 'UPDATE_VENUE',
    'READ_PROMO', 'CREATE_PROMO', 'UPDATE_PROMO', 'DELETE_PROMO', 'PUBLISH_PROMO',
    'READ_REVIEW', 'MODERATE_REVIEW', 'READ_RESERVATION', 'READ_PARTNER',
    'CREATE_PARTNER', 'MANAGE_PARTNER', 'ACCESS_ADMIN', 'VIEW_ANALYTICS',
    'PROCESS_PAYMENT', 'VIEW_PAYMENTS'
  ],
  
  SUPER_ADMIN: [
    'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_VENUE', 'CREATE_VENUE',
    'UPDATE_VENUE', 'DELETE_VENUE', 'READ_PROMO', 'CREATE_PROMO', 'UPDATE_PROMO',
    'DELETE_PROMO', 'PUBLISH_PROMO', 'READ_REVIEW', 'CREATE_REVIEW', 'MODERATE_REVIEW',
    'READ_RESERVATION', 'CREATE_RESERVATION', 'UPDATE_RESERVATION', 'CANCEL_RESERVATION',
    'READ_PARTNER', 'CREATE_PARTNER', 'MANAGE_PARTNER', 'ACCESS_ADMIN', 'ACCESS_SUPER_ADMIN',
    'MANAGE_USERS', 'VIEW_ANALYTICS', 'READ_MEMBERSHIP', 'MANAGE_MEMBERSHIP',
    'PROCESS_PAYMENT', 'REFUND_PAYMENT', 'VIEW_PAYMENTS'
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export async function checkPermission(
  userRole: string,
  requiredPermission: Permission
): Promise<{ allowed: boolean; error?: string }> {
  if (!hasPermission(userRole, requiredPermission)) {
    return { allowed: false, error: `Permission denied: ${requiredPermission}` };
  }
  return { allowed: true };
}

export function getAccessibleRoutes(role: string): string[] {
  const routes: string[] = [];
  if (hasPermission(role, 'ACCESS_SUPER_ADMIN')) {
    routes.push('/dashboard/super-admin', '/admin');
  }
  if (hasPermission(role, 'ACCESS_ADMIN')) {
    routes.push('/dashboard/ops', '/admin');
  }
  if (hasPermission(role, 'READ_VENUE')) {
    routes.push('/dashboard/owner', '/venue', '/discovery');
  }
  if (hasPermission(role, 'READ_USER')) {
    routes.push('/profile', '/dashboard');
  }
  return routes;
}
