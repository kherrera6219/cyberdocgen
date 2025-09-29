import { eq } from 'drizzle-orm';
import { db } from '../db';
import { systemConfigurations } from '@shared/schema';
import { encryptionService, DataClassification } from './encryption';
import { auditService, AuditAction, RiskLevel } from './auditService';
import { logger } from '../utils/logger';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  authorityHost?: string;
}

export interface PDFDefaults {
  defaultEncryptionLevel: 'RC4_40' | 'RC4_128' | 'AES128' | 'AES256';
  defaultAllowPrinting: boolean;
  defaultAllowCopying: boolean;
  defaultAllowModifying: boolean;
  defaultAllowAnnotations: boolean;
  defaultWatermarkText: string;
  defaultWatermarkOpacity: number;
}

export class SystemConfigService {
  /**
   * Get OAuth credentials for a provider
   */
  async getOAuthCredentials(provider: 'google' | 'microsoft'): Promise<OAuthCredentials | null> {
    try {
      const config = await db.query.systemConfigurations.findFirst({
        where: eq(systemConfigurations.configKey, `oauth_${provider}`),
      });

      if (!config || !config.isActive) {
        return null;
      }

      const encryptedData = JSON.parse(config.configValueEncrypted);
      const decryptedValue = await encryptionService.decryptSensitiveField(encryptedData, DataClassification.RESTRICTED);
      const credentials = JSON.parse(decryptedValue);

      return {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tenantId: credentials.tenantId,
        authorityHost:
          provider === 'microsoft'
            ? credentials.authorityHost || 'https://login.microsoftonline.com'
            : undefined,
      };
    } catch (error: any) {
      logger.error(`Failed to get ${provider} OAuth credentials`, { error: error.message });
      return null;
    }
  }

  /**
   * Set OAuth credentials for a provider
   */
  async setOAuthCredentials(
    provider: 'google' | 'microsoft',
    credentials: OAuthCredentials,
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    try {
      const configKey = `oauth_${provider}`;
      const normalizedCredentials: OAuthCredentials = {
        clientId: credentials.clientId.trim(),
        clientSecret: credentials.clientSecret,
        tenantId: credentials.tenantId?.trim(),
        authorityHost: credentials.authorityHost?.trim() ||
          (provider === 'microsoft' ? 'https://login.microsoftonline.com' : undefined),
      };

      if (provider === 'microsoft' && !normalizedCredentials.tenantId) {
        throw new Error('Microsoft enterprise tenant ID is required for configuration');
      }

      const credentialsJson = JSON.stringify(normalizedCredentials);
      
      // Encrypt the credentials
      const encryptedData = await encryptionService.encryptSensitiveField(
        credentialsJson,
        DataClassification.RESTRICTED
      );
      const encryptedValue = JSON.stringify(encryptedData);

      // Upsert configuration
      await db.insert(systemConfigurations)
        .values({
          configKey,
          configType: 'oauth',
          configValueEncrypted: encryptedValue,
          description: `OAuth 2.0 credentials for ${provider} integration`,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: systemConfigurations.configKey,
          set: {
            configValueEncrypted: encryptedValue,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'oauth_credentials',
        resourceId: configKey,
        ipAddress,
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          provider,
          action: 'oauth_credentials_updated',
          adminAction: true,
        },
      });

      logger.info(`OAuth credentials updated for ${provider}`, {
        provider,
        userId,
        configKey,
      });

      return true;
    } catch (error: any) {
      logger.error(`Failed to set ${provider} OAuth credentials`, { 
        error: error.message,
        provider,
        userId,
      });
      return false;
    }
  }

  /**
   * Get PDF security defaults
   */
  async getPDFDefaults(): Promise<PDFDefaults> {
    try {
      const config = await db.query.systemConfigurations.findFirst({
        where: eq(systemConfigurations.configKey, 'pdf_defaults'),
      });

      if (!config || !config.isActive) {
        // Return system defaults
        return {
          defaultEncryptionLevel: 'AES256',
          defaultAllowPrinting: false,
          defaultAllowCopying: false,
          defaultAllowModifying: false,
          defaultAllowAnnotations: false,
          defaultWatermarkText: 'CONFIDENTIAL',
          defaultWatermarkOpacity: 0.3,
        };
      }

      const encryptedData = JSON.parse(config.configValueEncrypted);
      const decryptedValue = await encryptionService.decryptSensitiveField(encryptedData, DataClassification.INTERNAL);
      return JSON.parse(decryptedValue);
    } catch (error: any) {
      logger.error('Failed to get PDF defaults', { error: error.message });
      
      // Return system defaults on error
      return {
        defaultEncryptionLevel: 'AES256',
        defaultAllowPrinting: false,
        defaultAllowCopying: false,
        defaultAllowModifying: false,
        defaultAllowAnnotations: false,
        defaultWatermarkText: 'CONFIDENTIAL',
        defaultWatermarkOpacity: 0.3,
      };
    }
  }

  /**
   * Set PDF security defaults
   */
  async setPDFDefaults(
    defaults: PDFDefaults,
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    try {
      const configKey = 'pdf_defaults';
      const defaultsJson = JSON.stringify(defaults);
      
      // Encrypt the defaults (less sensitive than OAuth but still encrypted)
      const encryptedData = await encryptionService.encryptSensitiveField(
        defaultsJson,
        DataClassification.INTERNAL
      );
      const encryptedValue = JSON.stringify(encryptedData);

      // Upsert configuration
      await db.insert(systemConfigurations)
        .values({
          configKey,
          configType: 'security',
          configValueEncrypted: encryptedValue,
          description: 'Default PDF security settings for new documents',
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: systemConfigurations.configKey,
          set: {
            configValueEncrypted: encryptedValue,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'pdf_defaults',
        resourceId: configKey,
        ipAddress,
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          action: 'pdf_defaults_updated',
          defaults,
          adminAction: true,
        },
      });

      logger.info('PDF defaults updated', {
        userId,
        configKey,
        defaults,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to set PDF defaults', { 
        error: error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Check if OAuth provider is configured
   */
  async isOAuthConfigured(provider: 'google' | 'microsoft'): Promise<boolean> {
    try {
      const credentials = await this.getOAuthCredentials(provider);
      if (!credentials?.clientId || !credentials?.clientSecret) {
        return false;
      }

      if (provider === 'microsoft') {
        return !!credentials?.tenantId;
      }

      return true;
    } catch (error: any) {
      logger.error(`Failed to check ${provider} OAuth configuration`, { error: error.message });
      return false;
    }
  }

  /**
   * Get masked OAuth settings for UI display
   */
  async getOAuthSettingsForUI() {
    try {
      const [googleConfigured, microsoftConfigured] = await Promise.all([
        this.isOAuthConfigured('google'),
        this.isOAuthConfigured('microsoft'),
      ]);

      let googleClientId = '';
      let microsoftClientId = '';
      let microsoftTenantId = '';

      if (googleConfigured) {
        const googleCreds = await this.getOAuthCredentials('google');
        if (googleCreds?.clientId) {
          googleClientId = googleCreds.clientId.substring(0, 8) + '...';
        }
      }

      if (microsoftConfigured) {
        const microsoftCreds = await this.getOAuthCredentials('microsoft');
        if (microsoftCreds?.clientId) {
          microsoftClientId = microsoftCreds.clientId.substring(0, 8) + '...';
        }
        if (microsoftCreds?.tenantId) {
          microsoftTenantId = microsoftCreds.tenantId.substring(0, 8) + '...';
        }
      }

      return {
        googleConfigured,
        microsoftConfigured,
        googleClientId,
        microsoftClientId,
        microsoftTenantId,
      };
    } catch (error: any) {
      logger.error('Failed to get OAuth settings for UI', { error: error.message });
      return {
        googleConfigured: false,
        microsoftConfigured: false,
        googleClientId: '',
        microsoftClientId: '',
        microsoftTenantId: '',
      };
    }
  }

  /**
   * Delete OAuth configuration
   */
  async deleteOAuthCredentials(
    provider: 'google' | 'microsoft',
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    try {
      const configKey = `oauth_${provider}`;
      
      const result = await db.delete(systemConfigurations)
        .where(eq(systemConfigurations.configKey, configKey));

      if (result.rowCount === 0) {
        return false;
      }

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.DELETE,
        resourceType: 'oauth_credentials',
        resourceId: configKey,
        ipAddress,
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          provider,
          action: 'oauth_credentials_deleted',
          adminAction: true,
        },
      });

      logger.info(`OAuth credentials deleted for ${provider}`, {
        provider,
        userId,
        configKey,
      });

      return true;
    } catch (error: any) {
      logger.error(`Failed to delete ${provider} OAuth credentials`, { 
        error: error.message,
        provider,
        userId,
      });
      return false;
    }
  }
}

export const systemConfigService = new SystemConfigService();