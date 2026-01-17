/**
 * Key Rotation Service - Phase 4
 * Implements automated key rotation with comprehensive audit logging
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import { auditService, AuditAction, RiskLevel } from "./auditService";
import crypto from "crypto";
import { pgTable, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Key Rotation History Table (would be added to schema.ts)
export const keyRotationHistory = pgTable("key_rotation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyName: varchar("key_name").notNull(),
  keyType: varchar("key_type").notNull(), // encryption, signing, api, session
  previousKeyId: varchar("previous_key_id"),
  newKeyId: varchar("new_key_id").notNull(),
  rotationReason: varchar("rotation_reason").notNull(), // scheduled, compromised, manual, policy
  rotatedBy: varchar("rotated_by"), // User ID if manual
  keyMetadata: jsonb("key_metadata").$type<{
    algorithm?: string;
    keySize?: number;
    expiresAt?: string;
    purpose?: string;
  }>(),
  status: varchar("status", { enum: ["pending", "active", "revoked", "expired"] }).notNull().default("pending"),
  rotatedAt: timestamp("rotated_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("idx_key_rotation_name").on(table.keyName),
  index("idx_key_rotation_status").on(table.status),
  index("idx_key_rotation_date").on(table.rotatedAt),
]);

export interface KeyRotationPolicy {
  keyName: string;
  rotationIntervalDays: number;
  gracePeriodDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
}

export interface KeyInfo {
  keyId: string;
  keyName: string;
  keyType: string;
  createdAt: Date;
  expiresAt?: Date;
  status: "active" | "expired" | "revoked";
  rotationDue: boolean;
}

export interface RotationResult {
  success: boolean;
  keyId: string;
  previousKeyId?: string;
  rotatedAt: Date;
  reason: string;
  error?: string;
}

export class KeyRotationService {
  private readonly DEFAULT_ROTATION_POLICIES: Record<string, KeyRotationPolicy> = {
    encryption_key: {
      keyName: "encryption_key",
      rotationIntervalDays: 90,
      gracePeriodDays: 7,
      autoRotate: true,
      notifyBeforeDays: 14,
    },
    signing_key: {
      keyName: "signing_key",
      rotationIntervalDays: 180,
      gracePeriodDays: 14,
      autoRotate: true,
      notifyBeforeDays: 30,
    },
    api_key: {
      keyName: "api_key",
      rotationIntervalDays: 365,
      gracePeriodDays: 30,
      autoRotate: false,
      notifyBeforeDays: 60,
    },
    session_secret: {
      keyName: "session_secret",
      rotationIntervalDays: 30,
      gracePeriodDays: 3,
      autoRotate: true,
      notifyBeforeDays: 7,
    },
  };

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(
    reason: "scheduled" | "compromised" | "manual" | "policy",
    rotatedBy?: string
  ): Promise<RotationResult> {
    try {
      logger.info("Starting encryption key rotation", { reason, rotatedBy });

      const previousKeyId = this.getCurrentEncryptionKeyId();
      const newKey = this.generateEncryptionKey();
      const newKeyId = this.generateKeyId();

      // Store new key securely (in production, use KMS)
      await this.storeKey(newKeyId, newKey, "encryption");

      // Log rotation in audit trail
      await auditService.logAuditEvent({
        action: AuditAction.UPDATE,
        resourceType: "encryption_key",
        resourceId: newKeyId,
        ipAddress: "system",
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          previousKeyId,
          newKeyId,
          reason,
          rotatedBy: rotatedBy || "system",
        },
      });

      // Record rotation in history
      await this.recordRotation({
        keyName: "encryption_key",
        keyType: "encryption",
        previousKeyId,
        newKeyId,
        rotationReason: reason,
        rotatedBy,
        keyMetadata: {
          algorithm: "AES-256-CBC",
          keySize: 256,
          expiresAt: this.calculateExpiryDate(90).toISOString(),
        },
      });

      logger.info("Encryption key rotated successfully", {
        newKeyId,
        previousKeyId,
      });

      return {
        success: true,
        keyId: newKeyId,
        previousKeyId,
        rotatedAt: new Date(),
        reason,
      };
    } catch (error: any) {
      logger.error("Failed to rotate encryption key", {
        error: error.message,
        reason,
      });

      return {
        success: false,
        keyId: "",
        rotatedAt: new Date(),
        reason,
        error: error.message,
      };
    }
  }

  /**
   * Rotate signing key for JWT tokens
   */
  async rotateSigningKey(
    reason: "scheduled" | "compromised" | "manual" | "policy",
    rotatedBy?: string
  ): Promise<RotationResult> {
    try {
      logger.info("Starting signing key rotation", { reason, rotatedBy });

      const previousKeyId = this.getCurrentSigningKeyId();
      const { publicKey, privateKey } = this.generateSigningKeyPair();
      const newKeyId = this.generateKeyId();

      // Store new key pair securely
      await this.storeKeyPair(newKeyId, publicKey, privateKey, "signing");

      // Log rotation
      await auditService.logAuditEvent({
        action: AuditAction.UPDATE,
        resourceType: "signing_key",
        resourceId: newKeyId,
        ipAddress: "system",
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          previousKeyId,
          newKeyId,
          reason,
          rotatedBy: rotatedBy || "system",
        },
      });

      // Record rotation
      await this.recordRotation({
        keyName: "signing_key",
        keyType: "signing",
        previousKeyId,
        newKeyId,
        rotationReason: reason,
        rotatedBy,
        keyMetadata: {
          algorithm: "RS256",
          keySize: 2048,
          expiresAt: this.calculateExpiryDate(180).toISOString(),
        },
      });

      logger.info("Signing key rotated successfully", { newKeyId, previousKeyId });

      return {
        success: true,
        keyId: newKeyId,
        previousKeyId,
        rotatedAt: new Date(),
        reason,
      };
    } catch (error: any) {
      logger.error("Failed to rotate signing key", {
        error: error.message,
        reason,
      });

      return {
        success: false,
        keyId: "",
        rotatedAt: new Date(),
        reason,
        error: error.message,
      };
    }
  }

  /**
   * Check if key rotation is due
   */
  async checkRotationDue(keyName: string): Promise<{
    isDue: boolean;
    daysUntilExpiry: number;
    shouldNotify: boolean;
  }> {
    try {
      const policy = this.DEFAULT_ROTATION_POLICIES[keyName];
      if (!policy) {
        return { isDue: false, daysUntilExpiry: 0, shouldNotify: false };
      }

      const lastRotation = await this.getLastRotation(keyName);
      if (!lastRotation) {
        return { isDue: true, daysUntilExpiry: 0, shouldNotify: true };
      }

      const daysSinceRotation = this.calculateDaysSince(lastRotation.rotatedAt);
      const daysUntilExpiry = policy.rotationIntervalDays - daysSinceRotation;

      const isDue = daysUntilExpiry <= 0;
      const shouldNotify = daysUntilExpiry <= policy.notifyBeforeDays && daysUntilExpiry > 0;

      return {
        isDue,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        shouldNotify,
      };
    } catch (error: any) {
      logger.error("Failed to check rotation due", {
        error: error.message,
        keyName,
      });
      return { isDue: false, daysUntilExpiry: 0, shouldNotify: false };
    }
  }

  /**
   * Get rotation schedule for all keys
   */
  async getRotationSchedule(): Promise<Array<{
    keyName: string;
    lastRotation?: Date;
    nextRotation: Date;
    daysUntilRotation: number;
    status: "current" | "due_soon" | "overdue";
  }>> {
    const schedule: Array<any> = [];

    for (const [keyName, policy] of Object.entries(this.DEFAULT_ROTATION_POLICIES)) {
      const rotationCheck = await this.checkRotationDue(keyName);
      const lastRotation = await this.getLastRotation(keyName);

      const nextRotation = lastRotation
        ? this.calculateNextRotation(lastRotation.rotatedAt, policy.rotationIntervalDays)
        : new Date();

      let status: "current" | "due_soon" | "overdue" = "current";
      if (rotationCheck.isDue) {
        status = "overdue";
      } else if (rotationCheck.shouldNotify) {
        status = "due_soon";
      }

      schedule.push({
        keyName,
        lastRotation: lastRotation?.rotatedAt,
        nextRotation,
        daysUntilRotation: rotationCheck.daysUntilExpiry,
        status,
      });
    }

    return schedule;
  }

  /**
   * Perform scheduled rotations (should be called by cron job)
   */
  async performScheduledRotations(): Promise<{
    rotated: string[];
    failed: string[];
    skipped: string[];
  }> {
    logger.info("Starting scheduled key rotation check");

    const rotated: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const [keyName, policy] of Object.entries(this.DEFAULT_ROTATION_POLICIES)) {
      if (!policy.autoRotate) {
        skipped.push(keyName);
        continue;
      }

      const rotationCheck = await this.checkRotationDue(keyName);
      if (!rotationCheck.isDue) {
        skipped.push(keyName);
        continue;
      }

      try {
        let result: RotationResult;

        if (keyName === "encryption_key") {
          result = await this.rotateEncryptionKey("scheduled");
        } else if (keyName === "signing_key") {
          result = await this.rotateSigningKey("scheduled");
        } else {
          skipped.push(keyName);
          continue;
        }

        if (result.success) {
          rotated.push(keyName);
        } else {
          failed.push(keyName);
        }
      } catch (error: any) {
        logger.error("Failed to rotate key during scheduled rotation", {
          error: error.message,
          keyName,
        });
        failed.push(keyName);
      }
    }

    logger.info("Scheduled key rotation complete", {
      rotated,
      failed,
      skipped,
    });

    return { rotated, failed, skipped };
  }

  /**
   * Get rotation history for a key
   */
  async getRotationHistory(keyName: string, limit: number = 10): Promise<any[]> {
    try {
      // In production, query the keyRotationHistory table
      // Mock implementation
      logger.info("Fetching rotation history", { keyName, limit });
      return [];
    } catch (error: any) {
      logger.error("Failed to fetch rotation history", {
        error: error.message,
        keyName,
      });
      return [];
    }
  }

  /**
   * Revoke a specific key
   */
  async revokeKey(keyId: string, reason: string, revokedBy: string): Promise<boolean> {
    try {
      logger.info("Revoking key", { keyId, reason, revokedBy });

      // Mark key as revoked in storage
      // Update key rotation history

      await auditService.logAuditEvent({
        action: AuditAction.DELETE,
        resourceType: "key",
        resourceId: keyId,
        ipAddress: "system",
        riskLevel: RiskLevel.CRITICAL,
        additionalContext: {
          reason,
          revokedBy,
        },
      });

      logger.info("Key revoked successfully", { keyId });
      return true;
    } catch (error: any) {
      logger.error("Failed to revoke key", {
        error: error.message,
        keyId,
      });
      return false;
    }
  }

  // ===== Private Helper Methods =====

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateSigningKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return { publicKey, privateKey };
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  private getCurrentEncryptionKeyId(): string {
    // In production, fetch from secure storage
    return process.env.ENCRYPTION_KEY_ID || "default_encryption_key";
  }

  private getCurrentSigningKeyId(): string {
    // In production, fetch from secure storage
    return process.env.SIGNING_KEY_ID || "default_signing_key";
  }

  private async storeKey(keyId: string, key: string, keyType: string): Promise<void> {
    // In production, store in KMS (AWS KMS, Azure Key Vault, HashiCorp Vault)
    logger.info("Storing key securely", { keyId, keyType });
    // Mock implementation - DO NOT do this in production
  }

  private async storeKeyPair(
    keyId: string,
    publicKey: string,
    privateKey: string,
    keyType: string
  ): Promise<void> {
    // In production, store in KMS
    logger.info("Storing key pair securely", { keyId, keyType });
    // Mock implementation
  }

  private async recordRotation(data: {
    keyName: string;
    keyType: string;
    previousKeyId?: string;
    newKeyId: string;
    rotationReason: string;
    rotatedBy?: string;
    keyMetadata?: any;
  }): Promise<void> {
    // In production, insert into keyRotationHistory table
    logger.info("Recording key rotation", {
      keyName: data.keyName,
      newKeyId: data.newKeyId,
    });
  }

  private async getLastRotation(keyName: string): Promise<any | null> {
    // In production, query keyRotationHistory table
    // Mock implementation
    return null;
  }

  private calculateDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private calculateExpiryDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private calculateNextRotation(lastRotation: Date, intervalDays: number): Date {
    const nextRotation = new Date(lastRotation);
    nextRotation.setDate(nextRotation.getDate() + intervalDays);
    return nextRotation;
  }
}

export const keyRotationService = new KeyRotationService();
