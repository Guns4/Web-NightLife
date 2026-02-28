/**
 * =====================================================
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * Permission definitions and helpers for SUPER_ADMIN/ADMIN separation
 * =====================================================
 */

// User roles
export type UserRole = 
  | 'GUEST'
  | 'USER'
  | 'OWNER'
  | 'VENUE_MANAGER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// Permission types
export type Permission = 
  | 'MANAGE_TIERS'
  | 'MANAGE_ADMINS'
  | 'APPROVE_REVIEWS'
  | 'VIEW_FINANCIALS'
  | 'SYSTEM_CONFIG'
  | 'MANAGE_VENUES'
  | 'MANAGE_PROMOS'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_USERS';

// Permission to role mapping
// Only SUPER_ADMIN can have these permissions
export const SUPER_ADMIN_ONLY_PERMISSIONS: Permission[] = [
  'MANAGE_TIERS',
  'MANAGE_ADMINS',
  'VIEW_FINANCIALS',
  'SYSTEM_CONFIG',
];

// Both ADMIN and SUPER_ADMIN can have these permissions
export const ADMIN_PERMISSIONS: Permission[] = [
  'APPROVE_REVIEWS',
  'VIEW_ANALYTICS',
  'MANAGE_VENUES',
  'MANAGE_PROMOS',
];

// OWNER and VENUE_MANAGER permissions
export const MERCHANT_PERMISSIONS: Permission[] = [
  'MANAGE_VENUES',
  'MANAGE_PROMOS',
];

// All permissions constant
export const PERMISSIONS: Record<Permission, {
  name: string;
  description: string;
  roles: UserRole[];
}> = {
  // SUPER_ADMIN only
  MANAGE_TIERS: {
    name: 'Manage Pricing Tiers',
    description: 'Create and modify pricing tier configurations',
    roles: ['SUPER_ADMIN'],
  },
  MANAGE_ADMINS: {
    name: 'Manage Admins',
    description: 'Add, remove, or modify admin accounts',
    roles: ['SUPER_ADMIN'],
  },
  VIEW_FINANCIALS: {
    name: 'View Financial Reports',
    description: 'Access to all financial data and reports',
    roles: ['SUPER_ADMIN'],
  },
  SYSTEM_CONFIG: {
    name: 'System Configuration',
    description: 'Modify system settings and API keys',
    roles: ['SUPER_ADMIN'],
  },
  
  // ADMIN and SUPER_ADMIN
  APPROVE_REVIEWS: {
    name: 'Approve Reviews',
    description: 'Verify and approve user-submitted reviews',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  VIEW_ANALYTICS: {
    name: 'View Analytics',
    description: 'Access to platform analytics and insights',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  MANAGE_VENUES: {
    name: 'Manage Venues',
    description: 'Create, edit, or remove venue listings',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  MANAGE_PROMOS: {
    name: 'Manage Promos',
    description: 'Create, edit, or remove promotions',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  
  // Merchants
  MANAGE_USERS: {
    name: 'Manage Users',
    description: 'View and manage user accounts',
    roles: ['OWNER', 'VENUE_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  },
};

// Role hierarchy (higher = more access)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  USER: 1,
  OWNER: 2,
  VENUE_MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissionConfig = PERMISSIONS[permission];
  return permissionConfig.roles.includes(role);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const permissions: Permission[] = [];
  
  for (const [key, config] of Object.entries(PERMISSIONS)) {
    if (config.roles.includes(role)) {
      permissions.push(key as Permission);
    }
  }
  
  return permissions;
}

/**
 * Check if role A has higher or equal privileges than role B
 */
export function hasRolePrivilege(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if user is SUPER_ADMIN
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if user is ADMIN (including SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user is a merchant (OWNER or VENUE_MANAGER)
 */
export function isMerchant(role: UserRole): boolean {
  return role === 'OWNER' || role === 'VENUE_MANAGER';
}
