import { storage } from "../storage";
import { ingestionService } from "./ingestionService";
import { auditService, AuditAction } from "./auditService";
import { logger } from "../utils/logger";
import { evidenceSnapshots, connectorConfigs, cloudIntegrations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

// Types
export type ConnectorType = 'sharepoint' | 'jira' | 'notion';

export interface ConnectorItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'page' | 'issue' | 'project';
  mimeType?: string;
  externalUrl: string;
  lastModified?: Date;
  metadata?: Record<string, any>;
  content?: string; // For text-based imports like Notion pages or Jira tickets
  downloadUrl?: string; // For files
}

export interface ConnectorAdapter {
  type: ConnectorType;
  connect(integrationId: string): Promise<boolean>;
  listItems(config: any, path?: string): Promise<ConnectorItem[]>;
  fetchItem(item: ConnectorItem): Promise<Buffer | string>;
}

// Mock Adapters (To be implemented fully later)
class SharePointAdapter implements ConnectorAdapter {
  type: ConnectorType = 'sharepoint';
  async connect(integrationId: string) { return true; }
  async listItems(config: any, path?: string) { return []; } // TODO: Implement Graph API
  async fetchItem(item: ConnectorItem) { return "mock content"; }
}

class JiraAdapter implements ConnectorAdapter {
  type: ConnectorType = 'jira';
  async connect(integrationId: string) { return true; }
  async listItems(config: any) { return []; } // TODO: Implement Jira REST API
  async fetchItem(item: ConnectorItem) { return "mock content"; }
}

class NotionAdapter implements ConnectorAdapter {
  type: ConnectorType = 'notion';
  async connect(integrationId: string) { return true; }
  async listItems(config: any) { return []; } // TODO: Implement Notion API
  async fetchItem(item: ConnectorItem) { return "mock content"; }
}

class ConnectorService {
  private adapters: Map<ConnectorType, ConnectorAdapter> = new Map();

  constructor() {
    this.registerAdapter(new SharePointAdapter());
    this.registerAdapter(new JiraAdapter());
    this.registerAdapter(new NotionAdapter());
  }

  registerAdapter(adapter: ConnectorAdapter) {
    this.adapters.set(adapter.type, adapter);
  }

  getAdapter(type: ConnectorType): ConnectorAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new Error(`Adapter for ${type} not found`);
    return adapter;
  }

  // configuration management
  async createConfig(userId: string, orgId: string, integrationId: string, name: string, type: ConnectorType, scopeConfig: any, ipAddress: string = 'unknown') {
    const [config] = await db.insert(connectorConfigs).values({
      integrationId,
      organizationId: orgId,
      name,
      connectorType: type,
      scopeConfig,
      syncMode: 'manual'
    }).returning();

    await auditService.logEvent({
      organizationId: orgId,
      userId,
      action: AuditAction.CREATE,
      resourceType: 'connector_config',
      resourceId: config.id,
      ipAddress,
      details: { name, type }
    });

    return this.sanitizeConfig(config);
  }

  // Helper to strip secrets from config
  private sanitizeConfig(config: any) {
    if (!config) return null;
    const clean = { ...config };
    if (clean.scopeConfig) {
        // Deep copy to avoid mutating original if needed types exist
        const safeScope = { ...clean.scopeConfig };
        const secretKeys = ['token', 'password', 'clientSecret', 'apiKey', 'secret'];
        
        for (const key of Object.keys(safeScope)) {
            if (secretKeys.some(secret => key.toLowerCase().includes(secret.toLowerCase()))) {
                safeScope[key] = '********';
            }
        }
        clean.scopeConfig = safeScope;
    }
    return clean;
  }

  async getConfigs(orgId: string) {
    const configs = await db.select().from(connectorConfigs).where(eq(connectorConfigs.organizationId, orgId));
    return configs.map(this.sanitizeConfig);
  }

  // Execution
  async runImport(userId: string, configId: string, snapshotId: string | undefined, ipAddress: string = 'unknown') {
    const [config] = await db.select().from(connectorConfigs).where(eq(connectorConfigs.id, configId));
    if (!config) throw new Error("Connector config not found");

    const adapter = this.getAdapter(config.connectorType as ConnectorType);
    
    // If no snapshot provided, create a new one based on the config name
    let targetSnapshotId = snapshotId;
    if (!targetSnapshotId) {
       // Logic to create or reuse snapshot... for now ensure it's passed or create new
       throw new Error("Snapshot ID is required for import");
    }

    // 1. Audit Start
    await auditService.logEvent({
      organizationId: config.organizationId,
      userId, 
      action: AuditAction.UPDATE, 
      resourceType: 'connector_import', 
      resourceId: configId, 
      ipAddress,
      details: { status: 'started', snapshotId: targetSnapshotId } 
    });

    try {
      // 2. Fetch Items
      const items = await adapter.listItems(config.scopeConfig); // Simplified recursive fetch

      // 3. Ingest Loop
      for (const item of items) {
         // Download content
         const content = await adapter.fetchItem(item);
         const fileBuffer = typeof content === 'string' ? Buffer.from(content) : Buffer.from(content);
         
         // Ingest
         await ingestionService.ingestFile({
            fileName: item.name,
            file: fileBuffer,
            snapshotId: targetSnapshotId,
            category: 'Evidence', // Default to Evidence for connectors
            organizationId: config.organizationId,
            userId: userId
         });
      }

      // 4. Update Config State
      await db.update(connectorConfigs)
        .set({ lastSnapshotId: targetSnapshotId, lastSyncedAt: new Date() })
        .where(eq(connectorConfigs.id, configId));

      // 5. Audit Success
      await auditService.logEvent({
        organizationId: config.organizationId, 
        userId, 
        action: AuditAction.UPDATE, 
        resourceType: 'connector_import', 
        resourceId: configId, 
        ipAddress,
        details: { status: 'completed', count: items.length } 
      });
    
    } catch (error: any) {
        await auditService.logEvent({
          organizationId: config.organizationId, 
          userId, 
          action: AuditAction.UPDATE, 
          resourceType: 'connector_import', 
          resourceId: configId, 
          ipAddress,
          details: { status: 'failed', error: error.message } 
        });
        throw error;
    }
  }
}

export const connectorService = new ConnectorService();
