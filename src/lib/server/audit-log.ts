/**
 * =====================================================
 * AUDIT LOGGING SERVICE
 * System audit logs for SUPER_ADMIN actions
 * =====================================================
 */

import { prisma } from "@/lib/auth/prisma-client";

// Audit action types
export type AuditAction = 
  | 'PRICING_TIER_UPDATE'
  | 'API_KEY_ROTATE'
  | 'SYSTEM_CONFIG_UPDATE'
  | 'ADMIN_USER_CREATE'
  | 'ADMIN_USER_UPDATE'
  | 'ADMIN_USER_DELETE'
  | 'VENUE_APPROVE'
  | 'VENUE_SUSPEND'
  | 'PROMO_APPROVE'
  | 'PROMO_REJECT';

// Audit log entry from database (raw)
export interface AuditLogRecord {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

// Audit log entry (transformed)
export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        userEmail: entry.userEmail,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: JSON.stringify(entry.details),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
    
    console.log(`[Audit] ${entry.action} by ${entry.userEmail} on ${entry.targetType}:${entry.targetId}`);
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log SUPER_ADMIN pricing tier changes
 */
export async function logPricingTierChange(
  userId: string,
  userEmail: string,
  tierName: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await createAuditLog({
    action: 'PRICING_TIER_UPDATE',
    userId,
    userEmail,
    targetType: 'PRICING_TIER',
    targetId: tierName,
    details: {
      tierName,
      changes: {
        old: oldValues,
        new: newValues,
      },
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log API key rotations
 */
export async function logApiKeyRotation(
  userId: string,
  userEmail: string,
  keyName: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await createAuditLog({
    action: 'API_KEY_ROTATE',
    userId,
    userEmail,
    targetType: 'API_KEY',
    targetId: keyName,
    details: {
      keyName,
      action: 'rotated',
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log system configuration changes
 */
export async function logSystemConfigChange(
  userId: string,
  userEmail: string,
  configKey: string,
  oldValue: any,
  newValue: any,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await createAuditLog({
    action: 'SYSTEM_CONFIG_UPDATE',
    userId,
    userEmail,
    targetType: 'SYSTEM_CONFIG',
    targetId: configKey,
    details: {
      configKey,
      changes: {
        old: oldValue,
        new: newValue,
      },
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(options?: {
  action?: AuditAction;
  userId?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<Omit<AuditLogRecord, 'details'> & { details: Record<string, unknown> }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}> {
  const where: Record<string, unknown> = {};

  if (options?.action) {
    where.action = options.action;
  }
  if (options?.userId) {
    where.userId = options.userId;
  }
  if (options?.targetType) {
    where.targetType = options.targetType;
  }
  if (options?.startDate || options?.endDate) {
    where.createdAt = {} as Record<string, Date>;
    if (options?.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate;
    }
    if (options?.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate;
    }
  }

  const logs = await prisma.systemAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  const total = await prisma.systemAuditLog.count({ where });

  return {
    logs: logs.map((log: AuditLogRecord) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userEmail: log.userEmail,
      targetType: log.targetType,
      targetId: log.targetId,
      details: JSON.parse(log.details as string || '{}'),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    })),
    pagination: {
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    },
  };
}
