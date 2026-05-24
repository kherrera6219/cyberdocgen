import { db } from '../db';
import { users, type User } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export type DirectoryProvider = 'okta' | 'entra-id' | 'gusto' | 'rippling';

export interface DirectoryUser {
  email: string;
  firstName: string;
  lastName: string;
  mfaActive: boolean;
  status: 'active' | 'suspended' | 'terminated';
  hireDate?: string;
  terminationDate?: string;
  department?: string;
}

export interface SyncConfig {
  id: string;
  organizationId: string;
  provider: DirectoryProvider;
  tenantUrl: string;
  clientId?: string;
  clientSecretEncrypted?: string;
  mfaEnforcementPolicy: boolean;
  autoProvision: boolean;
  enabled: boolean;
  lastSyncedAt?: string;
}

export interface SyncResult {
  provider: DirectoryProvider;
  startedAt: string;
  endedAt: string;
  totalSynced: number;
  newUsersProvisioned: number;
  terminatedAccessRevoked: number;
  mfaComplianceFailures: string[];
  unlinkedTerminatedEmployees: string[];
  success: boolean;
}

// In-Memory mock sync storage to act as local state for local-first mode
const syncConfigs: Map<string, SyncConfig> = new Map();

class DirectorySyncService {
  /**
   * Save sync configuration
   */
  async saveConfig(config: SyncConfig): Promise<SyncConfig> {
    const key = `${config.organizationId}:${config.provider}`;
    syncConfigs.set(key, config);
    logger.info(`Directory Sync Config saved for provider ${config.provider}`, {
      organizationId: config.organizationId,
      tenantUrl: config.tenantUrl,
    });
    return config;
  }

  /**
   * Get sync configuration for a provider
   */
  async getConfig(organizationId: string, provider: DirectoryProvider): Promise<SyncConfig | undefined> {
    const key = `${organizationId}:${provider}`;
    return syncConfigs.get(key);
  }

  /**
   * List configs for an organization
   */
  async listConfigs(organizationId: string): Promise<SyncConfig[]> {
    return Array.from(syncConfigs.values()).filter(c => c.organizationId === organizationId);
  }

  /**
   * Simulate directory fetch (Okta, Microsoft Entra ID, Gusto, Rippling)
   */
  private async fetchDirectoryUsers(provider: DirectoryProvider): Promise<DirectoryUser[]> {
    // High-fidelity GRC mock datasets to make the demo extremely premium and realistic
    if (provider === 'okta' || provider === 'entra-id') {
      return [
        { email: 'admin@cyberdocgen.com', firstName: 'Kevin', lastName: 'Herrera', mfaActive: true, status: 'active', department: 'Compliance' },
        { email: 'sarah.engineer@cyberdocgen.com', firstName: 'Sarah', lastName: 'Chen', mfaActive: true, status: 'active', department: 'Engineering' },
        { email: 'john.marketing@cyberdocgen.com', firstName: 'John', lastName: 'Smith', mfaActive: false, status: 'active', department: 'Marketing' },
        { email: 'terminated.staff@cyberdocgen.com', firstName: 'James', lastName: 'Miller', mfaActive: false, status: 'suspended', department: 'Sales' }
      ];
    } else if (provider === 'gusto' || provider === 'rippling') {
      return [
        { email: 'admin@cyberdocgen.com', firstName: 'Kevin', lastName: 'Herrera', mfaActive: true, status: 'active', hireDate: '2023-01-15' },
        { email: 'sarah.engineer@cyberdocgen.com', firstName: 'Sarah', lastName: 'Chen', mfaActive: true, status: 'active', hireDate: '2024-03-01' },
        { email: 'john.marketing@cyberdocgen.com', firstName: 'John', lastName: 'Smith', mfaActive: false, status: 'active', hireDate: '2024-06-10' },
        { email: 'terminated.staff@cyberdocgen.com', firstName: 'James', lastName: 'Miller', mfaActive: false, status: 'terminated', hireDate: '2023-08-01', terminationDate: '2026-05-01' }
      ];
    }
    return [];
  }

  /**
   * Run synchronization audit & reconciliation
   */
  async runSync(organizationId: string, provider: DirectoryProvider): Promise<SyncResult> {
    const startedAt = new Date().toISOString();
    const config = await this.getConfig(organizationId, provider);
    
    if (config) {
      config.lastSyncedAt = startedAt;
      syncConfigs.set(`${organizationId}:${provider}`, config);
    }

    const directoryUsers = await this.fetchDirectoryUsers(provider);
    const dbUsers = await db.query.users.findMany();

    let totalSynced = 0;
    let newUsersProvisioned = 0;
    let terminatedAccessRevoked = 0;
    const mfaComplianceFailures: string[] = [];
    const unlinkedTerminatedEmployees: string[] = [];

    const { alertingService } = await import('./alertingService');

    for (const dirUser of directoryUsers) {
      totalSynced++;
      const matchingDbUser = dbUsers.find(u => u.email.toLowerCase() === dirUser.email.toLowerCase());

      // 1. Audit MFA Compliance (for IdP)
      if ((provider === 'okta' || provider === 'entra-id') && config?.mfaEnforcementPolicy && !dirUser.mfaActive) {
        mfaComplianceFailures.push(dirUser.email);
        alertingService.emit('alert', {
          id: `mfa-failure-${dirUser.email}-${Date.now()}`,
          ruleId: 'security_incidents',
          title: 'SSO MFA Compliance Violation',
          message: `User ${dirUser.firstName} ${dirUser.lastName} (${dirUser.email}) logged in directory without multi-factor authentication.`,
          severity: 'high',
          timestamp: new Date(),
          acknowledged: false,
          metadata: { email: dirUser.email, provider }
        });
      }

      // 2. Provisioning Check
      if (!matchingDbUser && dirUser.status === 'active' && config?.autoProvision) {
        // Auto-provision user in our database
        await db.insert(users).values({
          email: dirUser.email,
          firstName: dirUser.firstName,
          lastName: dirUser.lastName,
          emailVerified: true,
          accountStatus: 'active',
          twoFactorEnabled: dirUser.mfaActive,
        });
        newUsersProvisioned++;
        logger.info(`Auto-provisioned directory user: ${dirUser.email}`);
      }

      // 3. Termination Access Audits
      if (matchingDbUser) {
        if (dirUser.status === 'terminated' || dirUser.status === 'suspended') {
          // If active in our app but terminated in Gusto/HRIS — CRITICAL GRC VIOLATION!
          if (matchingDbUser.accountStatus === 'active') {
            // Revoke access automatically in local-first environment to satisfy SOX/SOC2
            await db.update(users)
              .set({ accountStatus: 'suspended' })
              .where(eq(users.id, matchingDbUser.id));

            terminatedAccessRevoked++;
            logger.warn(`Revoked access for terminated employee: ${dirUser.email}`);

            alertingService.emit('alert', {
              id: `termination-revocation-${dirUser.email}-${Date.now()}`,
              ruleId: 'security_incidents',
              title: 'Access Revocation Audit Action',
              message: `Suspended local account for terminated employee: ${dirUser.firstName} ${dirUser.lastName} (${dirUser.email}) based on HRIS records.`,
              severity: 'critical',
              timestamp: new Date(),
              acknowledged: false,
              metadata: { email: dirUser.email, provider, terminationDate: dirUser.terminationDate }
            });
          }
        }
      } else {
        if (dirUser.status === 'terminated') {
          unlinkedTerminatedEmployees.push(dirUser.email);
        }
      }
    }

    const endedAt = new Date().toISOString();
    return {
      provider,
      startedAt,
      endedAt,
      totalSynced,
      newUsersProvisioned,
      terminatedAccessRevoked,
      mfaComplianceFailures,
      unlinkedTerminatedEmployees,
      success: true
    };
  }
}

export const directorySyncService = new DirectorySyncService();
