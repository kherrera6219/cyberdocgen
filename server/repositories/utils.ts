import { AuditLog } from "@shared/schema";
import { randomUUID } from "crypto";

export function buildAuditSignableData(log: Pick<AuditLog, "userId" | "organizationId" | "action" | "resourceType" | "resourceId" | "timestamp">): string {
  const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : new Date(0).toISOString();
  return JSON.stringify({
    userId: log.userId,
    orgId: log.organizationId,
    action: log.action,
    resource: `${log.resourceType}:${log.resourceId}`,
    timestamp,
  });
}

export function coerceLocalDateValue(value: unknown): Date | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function coerceLocalBooleanValue(value: unknown, fallback: boolean): number {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'number') {
    return value === 0 ? 0 : 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return 1;
    }
    if (normalized === 'false' || normalized === '0' || normalized.length === 0) {
      return 0;
    }
  }
  return fallback ? 1 : 0;
}

export function normalizeLocalUserWriteValues(input: Record<string, unknown>): Record<string, unknown> {
  const now = new Date();
  return {
    ...input,
    id: typeof input.id === 'string' && input.id.trim().length > 0 ? input.id : randomUUID(),
    role: typeof input.role === 'string' && input.role.trim().length > 0 ? input.role : 'user',
    accountStatus: typeof input.accountStatus === 'string' && input.accountStatus.trim().length > 0
      ? input.accountStatus
      : 'pending_verification',
    isActive: coerceLocalBooleanValue(input.isActive, true),
    emailVerified: coerceLocalBooleanValue(input.emailVerified, false),
    phoneVerified: coerceLocalBooleanValue(input.phoneVerified, false),
    twoFactorEnabled: coerceLocalBooleanValue(input.twoFactorEnabled, false),
    passkeyEnabled: coerceLocalBooleanValue(input.passkeyEnabled, false),
    failedLoginAttempts: typeof input.failedLoginAttempts === 'number' && Number.isFinite(input.failedLoginAttempts)
      ? input.failedLoginAttempts
      : 0,
    profilePreferences: input.profilePreferences ?? null,
    notificationSettings: input.notificationSettings ?? null,
    lastLoginAt: coerceLocalDateValue(input.lastLoginAt) ?? null,
    accountLockedUntil: coerceLocalDateValue(input.accountLockedUntil) ?? null,
    createdAt: coerceLocalDateValue(input.createdAt) ?? now,
    updatedAt: coerceLocalDateValue(input.updatedAt) ?? now,
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
