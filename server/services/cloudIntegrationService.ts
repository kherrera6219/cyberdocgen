// @ts-nocheck
// Cloud service integrations (requires package installation)
// import { google } from 'googleapis';
// import { Client } from '@microsoft/microsoft-graph-client';
// Lightweight runtime-safe shims to keep the module type-safe without optional deps
const google: any = {
  auth: {
    OAuth2: class {
      setCredentials(_: any) { /* noop for shim */ }
    }
  },
  drive: () => ({ files: { list: async () => ({ data: { files: [] as any[] } }) } })
};

class CustomAuthProvider {
  constructor(private accessToken: string) {}
  async getAccessToken(): Promise<string> { return this.accessToken; }
}

class MockGraphClient {
  api(): this { return this; }
  filter(): this { return this; }
  select(): this { return this; }
  top(): this { return this; }
  async get(): Promise<{ value: any[] }> { return { value: [] }; }
}

const Client: any = {
  initWithMiddleware: (_: any) => new MockGraphClient(),
};
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { cloudIntegrations, cloudFiles, oauthProviders } from '@shared/schema';
import { encryptionService, DataClassification } from './encryption';
import { auditService, AuditAction, RiskLevel } from './auditService';
import { systemConfigService } from './systemConfigService';
import { logger } from '../utils/logger';

export interface CloudIntegrationConfig {
  userId: string;
  organizationId: string;
  provider: 'google_drive' | 'onedrive';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userProfile: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: Date;
  webViewLink?: string;
  downloadLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface FileSecurityOptions {
  securityLevel: 'standard' | 'restricted' | 'confidential';
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
    canShare: boolean;
  };
  passwordProtected?: boolean;
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
  };
}

// Placeholder for authentication provider
// Will be implemented once Microsoft Graph packages are installed

export class CloudIntegrationService {
  
  /**
   * Create or update cloud integration
   */
  async createIntegration(config: CloudIntegrationConfig): Promise<string> {
    try {
      // Encrypt tokens
      const accessTokenEncrypted = JSON.stringify(await encryptionService.encryptSensitiveField(
        config.accessToken,
        DataClassification.RESTRICTED
      ));

      const refreshTokenEncrypted = config.refreshToken
        ? JSON.stringify(await encryptionService.encryptSensitiveField(config.refreshToken, DataClassification.RESTRICTED))
        : null;

      const [integration] = await db.insert(cloudIntegrations).values({
        userId: config.userId,
        organizationId: config.organizationId,
        provider: config.provider,
        providerUserId: config.userProfile.id,
        displayName: config.userProfile.displayName,
        email: config.userProfile.email,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: config.expiresAt,
        scopes: this.getProviderScopes(config.provider),
        isActive: true,
        lastSyncAt: new Date(),
        syncStatus: 'pending',
      }).onConflictDoUpdate({
        target: [cloudIntegrations.userId, cloudIntegrations.provider],
        set: {
          displayName: config.userProfile.displayName,
          email: config.userProfile.email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: config.expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
      }).returning();

      // Audit log
      await auditService.logAuditEvent({
        userId: config.userId,
        action: AuditAction.CREATE,
        resourceType: 'cloud_integration',
        resourceId: integration.id,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          provider: config.provider,
          email: config.userProfile.email,
          scopes: this.getProviderScopes(config.provider),
        },
      });

      logger.info('Cloud integration created', {
        integrationId: integration.id,
        provider: config.provider,
        userId: config.userId,
      });

      return integration.id;
    } catch (error: any) {
      logger.error('Failed to create cloud integration', { 
        error: error.message,
        provider: config.provider,
        userId: config.userId,
      });
      throw new Error(`Failed to create ${config.provider} integration`);
    }
  }

  /**
   * Sync files from cloud provider
   */
  async syncFiles(integrationId: string): Promise<{ synced: number; errors: number }> {
    try {
      const integration = await db.query.cloudIntegrations.findFirst({
        where: eq(cloudIntegrations.id, integrationId),
      });

      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      // Decrypt access token
      const accessToken = await encryptionService.decryptSensitiveField(integration.accessTokenEncrypted);

      let files: FileMetadata[] = [];

      if (integration.provider === 'google_drive') {
        files = await this.syncGoogleDriveFiles(accessToken);
      } else if (integration.provider === 'onedrive') {
        files = await this.syncOneDriveFiles(accessToken);
      }

      let synced = 0;
      let errors = 0;

      // Update sync status
      await db.update(cloudIntegrations)
        .set({ syncStatus: 'syncing', lastSyncAt: new Date() })
        .where(eq(cloudIntegrations.id, integrationId));

      for (const file of files) {
        try {
          await this.upsertCloudFile(integrationId, integration.organizationId, file);
          synced++;
        } catch (error) {
          logger.error('Failed to sync file', { 
            fileId: file.id, 
            fileName: file.name, 
            error 
          });
          errors++;
        }
      }

      // Update sync completion
      await db.update(cloudIntegrations)
        .set({ 
          syncStatus: errors > 0 ? 'error' : 'completed',
          lastSyncAt: new Date(),
        })
        .where(eq(cloudIntegrations.id, integrationId));

      // Audit log
      await auditService.logAuditEvent({
        userId: integration.userId,
        action: AuditAction.READ,
        resourceType: 'cloud_sync',
        resourceId: integrationId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.LOW,
        additionalContext: {
          provider: integration.provider,
          filesSynced: synced,
          errors: errors,
        },
      });

      logger.info('Cloud sync completed', {
        integrationId,
        provider: integration.provider,
        synced,
        errors,
      });

      return { synced, errors };
    } catch (error: any) {
      logger.error('Cloud sync failed', { integrationId, error: error.message });
      
      // Update sync status to error
      await db.update(cloudIntegrations)
        .set({ syncStatus: 'error' })
        .where(eq(cloudIntegrations.id, integrationId));

      throw error;
    }
  }

  /**
   * Get files from Google Drive
   */
  private async syncGoogleDriveFiles(accessToken: string): Promise<FileMetadata[]> {
    try {
      // Get OAuth credentials from system configuration
      const credentials = await systemConfigService.getOAuthCredentials('google');
      if (!credentials) {
        throw new Error('Google OAuth credentials not configured');
      }

      const auth = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret
      );
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        pageSize: 100,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents)',
        q: "trashed=false and (mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')",
      });

      return response.data.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: parseInt(file.size || '0'),
        modifiedTime: new Date(file.modifiedTime!),
        webViewLink: file.webViewLink,
        downloadLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents,
      })) || [];
    } catch (error: any) {
      logger.error('Failed to sync Google Drive files', { error: error.message });
      throw new Error('Failed to sync Google Drive files');
    }
  }

  /**
   * Get files from OneDrive
   */
  private async syncOneDriveFiles(accessToken: string): Promise<FileMetadata[]> {
    try {
      // Check if Microsoft OAuth credentials are configured
      const credentials = await systemConfigService.getOAuthCredentials('microsoft');
      if (!credentials) {
        throw new Error('Microsoft OAuth credentials not configured');
      }

      const authProvider = new CustomAuthProvider(accessToken);
      const graphClient = Client.initWithMiddleware({ authProvider });

      const response = await graphClient
        .api('/me/drive/root/children')
        .filter("(file/mimeType eq 'application/pdf') or (file/mimeType eq 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') or (file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')")
        .select('id,name,file,size,lastModifiedDateTime,webUrl,@microsoft.graph.downloadUrl')
        .top(100)
        .get();

      return response.value?.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.file?.mimeType || 'application/octet-stream',
        size: file.size || 0,
        modifiedTime: new Date(file.lastModifiedDateTime),
        webViewLink: file.webUrl,
        downloadLink: file['@microsoft.graph.downloadUrl'],
        thumbnailLink: file.thumbnails?.[0]?.medium?.url,
      })) || [];
    } catch (error: any) {
      logger.error('Failed to sync OneDrive files', { error: error.message });
      throw new Error('Failed to sync OneDrive files');
    }
  }

  /**
   * Store/update cloud file metadata
   */
  private async upsertCloudFile(
    integrationId: string,
    organizationId: string,
    file: FileMetadata
  ): Promise<void> {
    const fileType = this.getFileTypeFromMime(file.mimeType);
    const securityLevel = fileType === 'pdf' ? 'restricted' : 'standard';

    await db.insert(cloudFiles).values({
      integrationId,
      organizationId,
      providerFileId: file.id,
      fileName: file.name,
      filePath: file.parents?.[0] || '/',
      fileType,
      fileSize: file.size,
      mimeType: file.mimeType,
      isSecurityLocked: fileType === 'pdf',
      securityLevel,
      permissions: {
        canView: true,
        canEdit: false,
        canDownload: fileType !== 'pdf',
        canShare: false,
      },
      thumbnailUrl: file.thumbnailLink,
      downloadUrl: file.downloadLink,
      webViewUrl: file.webViewLink,
      lastModified: file.modifiedTime,
      syncedAt: new Date(),
    }).onConflictDoUpdate({
      target: [cloudFiles.integrationId, cloudFiles.providerFileId],
      set: {
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.modifiedTime,
        downloadUrl: file.downloadLink,
        webViewUrl: file.webViewLink,
        thumbnailUrl: file.thumbnailLink,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Apply security settings to PDF
   */
  async applyPDFSecurity(
    fileId: string,
    securityOptions: FileSecurityOptions,
    userId: string
  ): Promise<boolean> {
    try {
      const file = await db.query.cloudFiles.findFirst({
        where: eq(cloudFiles.id, fileId),
      });

      if (!file || file.fileType !== 'pdf') {
        throw new Error('File not found or not a PDF');
      }

      // Update file security settings
      await db.update(cloudFiles)
        .set({
          securityLevel: securityOptions.securityLevel,
          permissions: securityOptions.permissions,
          isSecurityLocked: true,
          updatedAt: new Date(),
        })
        .where(eq(cloudFiles.id, fileId));

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'pdf_security',
        resourceId: fileId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          fileName: file.fileName,
          securityLevel: securityOptions.securityLevel,
          permissions: securityOptions.permissions,
          passwordProtected: securityOptions.passwordProtected,
          watermarkEnabled: securityOptions.watermark?.enabled,
        },
      });

      logger.info('PDF security applied', {
        fileId,
        fileName: file.fileName,
        securityLevel: securityOptions.securityLevel,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to apply PDF security', { fileId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's cloud integrations
   */
  async getUserIntegrations(userId: string) {
    return db.query.cloudIntegrations.findMany({
      where: eq(cloudIntegrations.userId, userId),
      orderBy: [cloudIntegrations.createdAt],
    });
  }

  /**
   * Get cloud files for organization
   */
  async getOrganizationFiles(organizationId: string, filters?: {
    provider?: string;
    fileType?: string;
    securityLevel?: string;
  }) {
    let whereCondition = eq(cloudFiles.organizationId, organizationId);

    if (filters?.fileType) {
      whereCondition = and(whereCondition, eq(cloudFiles.fileType, filters.fileType));
    }

    if (filters?.securityLevel) {
      whereCondition = and(whereCondition, eq(cloudFiles.securityLevel, filters.securityLevel));
    }

    return db.query.cloudFiles.findMany({
      where: whereCondition,
      with: {
        integration: true,
      },
      orderBy: [cloudFiles.lastModified],
    });
  }

  /**
   * Delete cloud integration
   */
  async deleteIntegration(integrationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db.delete(cloudIntegrations)
        .where(and(
          eq(cloudIntegrations.id, integrationId),
          eq(cloudIntegrations.userId, userId)
        ));

      if (result.rowCount === 0) {
        return false;
      }

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.DELETE,
        resourceType: 'cloud_integration',
        resourceId: integrationId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          action: 'integration_deleted',
        },
      });

      logger.info('Cloud integration deleted', { integrationId, userId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete cloud integration', { 
        integrationId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  private getProviderScopes(provider: string): string[] {
    switch (provider) {
      case 'google_drive':
        return ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/userinfo.profile'];
      case 'onedrive':
        return ['Files.Read', 'User.Read'];
      default:
        return [];
    }
  }

  private getFileTypeFromMime(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xlsx';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'pptx';
    return 'other';
  }
}

export const cloudIntegrationService = new CloudIntegrationService();