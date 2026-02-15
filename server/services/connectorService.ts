import { ingestionService } from "./ingestionService";
import { auditService, AuditAction } from "./auditService";
import { logger } from "../utils/logger";
import { connectorConfigs, cloudIntegrations } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { encryptionService, DataClassification } from "./encryption";
import { metricsCollector } from "../monitoring/metrics";
import { z } from "zod";

export type ConnectorType = "sharepoint" | "jira" | "notion";

export interface ConnectorItem {
  id: string;
  name: string;
  type: "file" | "folder" | "page" | "issue" | "project";
  mimeType?: string;
  externalUrl: string;
  lastModified?: Date;
  metadata?: Record<string, any>;
  content?: string;
  downloadUrl?: string;
}

export interface ConnectorAdapter {
  type: ConnectorType;
  connect(integrationId: string): Promise<boolean>;
  listItems(config: any, path?: string): Promise<ConnectorItem[]>;
  fetchItem(item: ConnectorItem, config?: any): Promise<Buffer | string>;
}

const sharePointDriveResponseSchema = z
  .object({
    value: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            webUrl: z.string().optional(),
            lastModifiedDateTime: z.string().optional(),
            file: z.object({ mimeType: z.string().optional() }).optional(),
            folder: z.object({ childCount: z.number().optional() }).optional(),
            "@microsoft.graph.downloadUrl": z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

const jiraSearchResponseSchema = z
  .object({
    issues: z
      .array(
        z
          .object({
            id: z.string(),
            key: z.string(),
            fields: z
              .object({
                summary: z.string().optional(),
                updated: z.string().optional(),
                issuetype: z.object({ name: z.string().optional() }).optional(),
                project: z
                  .object({
                    key: z.string().optional(),
                    name: z.string().optional(),
                  })
                  .optional(),
                description: z.unknown().optional(),
              })
              .optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

const jiraIssueResponseSchema = z
  .object({
    fields: z
      .object({
        summary: z.string().optional(),
        description: z.unknown().optional(),
      })
      .optional(),
  })
  .passthrough();

const notionPageSchema = z
  .object({
    object: z.string(),
    id: z.string(),
    url: z.string().optional(),
    last_edited_time: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const notionSearchResponseSchema = z
  .object({
    results: z.array(z.unknown()).optional(),
  })
  .passthrough();

const notionBlocksResponseSchema = z
  .object({
    results: z.array(z.unknown()).optional(),
    has_more: z.boolean().optional(),
    next_cursor: z.string().nullable().optional(),
  })
  .passthrough();

type SharePointDriveResponse = z.infer<typeof sharePointDriveResponseSchema>;
type JiraSearchResponse = z.infer<typeof jiraSearchResponseSchema>;
type JiraIssueResponse = z.infer<typeof jiraIssueResponseSchema>;
type NotionSearchResponse = z.infer<typeof notionSearchResponseSchema>;
type NotionPage = z.infer<typeof notionPageSchema>;
type NotionBlocksResponse = z.infer<typeof notionBlocksResponseSchema>;

function summarizeSchemaError(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

class SharePointAdapter implements ConnectorAdapter {
  type: ConnectorType = "sharepoint";

  constructor(
    private readonly getAccessToken: (integrationId: string) => Promise<string>
  ) {}

  async connect(integrationId: string): Promise<boolean> {
    try {
      await this.getAccessToken(integrationId);
      return true;
    } catch (error) {
      logger.warn("SharePoint connector connect failed", {
        integrationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async listItems(config: any): Promise<ConnectorItem[]> {
    const siteId: string | undefined = config.siteId;
    const integrationId: string | undefined = config.integrationId;
    const folderPaths: string[] =
      Array.isArray(config.folderPaths) && config.folderPaths.length > 0
        ? config.folderPaths
        : [""];

    if (!integrationId) {
      throw new Error("SharePoint connector missing integrationId");
    }
    if (!siteId) {
      throw new Error("SharePoint connector missing siteId in scopeConfig");
    }

    const items: ConnectorItem[] = [];
    for (const folderPath of folderPaths) {
      const normalizedPath = this.normalizeFolderPath(folderPath);
      const endpoint = normalizedPath
        ? `/sites/${siteId}/drive/root:/${normalizedPath}:/children`
        : `/sites/${siteId}/drive/root/children`;

      const data = await this.graphJson<SharePointDriveResponse>(
        integrationId,
        `${endpoint}?$top=200`,
        sharePointDriveResponseSchema
      );

      for (const entry of data.value || []) {
        if (!entry.file) {
          continue;
        }

        items.push({
          id: entry.id,
          name: entry.name,
          type: "file",
          mimeType: entry.file.mimeType,
          externalUrl: entry.webUrl || "",
          lastModified: entry.lastModifiedDateTime
            ? new Date(entry.lastModifiedDateTime)
            : undefined,
          downloadUrl: entry["@microsoft.graph.downloadUrl"],
          metadata: {
            source: "sharepoint",
            integrationId,
            siteId,
            folderPath: normalizedPath || "/",
          },
        });
      }
    }

    return items;
  }

  async fetchItem(item: ConnectorItem, config?: any): Promise<Buffer> {
    if (item.downloadUrl) {
      const startedAt = Date.now();
      let requestTracked = false;
      try {
        const downloadResponse = await fetch(item.downloadUrl);
        metricsCollector.trackConnectorRequest(
          this.type,
          Date.now() - startedAt,
          downloadResponse.ok
        );
        requestTracked = true;

        if (!downloadResponse.ok) {
          throw new Error(
            `SharePoint download failed (${downloadResponse.status}) for ${item.id}`
          );
        }
        const fileBytes = await downloadResponse.arrayBuffer();
        return Buffer.from(fileBytes);
      } catch (error) {
        if (!requestTracked) {
          metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
        }
        throw error;
      }
    }

    const integrationId = config?.integrationId || item.metadata?.integrationId;
    const siteId = config?.siteId || item.metadata?.siteId;
    if (!integrationId || !siteId) {
      throw new Error(
        `SharePoint fetch requires integrationId and siteId for item ${item.id}`
      );
    }

    const token = await this.getAccessToken(integrationId);
    const startedAt = Date.now();
    let requestTracked = false;
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${item.id}/content`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      metricsCollector.trackConnectorRequest(
        this.type,
        Date.now() - startedAt,
        response.ok
      );
      requestTracked = true;

      if (!response.ok) {
        throw new Error(
          `SharePoint file content request failed (${response.status}) for ${item.id}`
        );
      }

      const bytes = await response.arrayBuffer();
      return Buffer.from(bytes);
    } catch (error) {
      if (!requestTracked) {
        metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
      }
      throw error;
    }
  }

  private async graphJson<T>(
    integrationId: string,
    path: string,
    schema?: z.ZodType<T>
  ): Promise<T> {
    const token = await this.getAccessToken(integrationId);
    const startedAt = Date.now();
    let requestTracked = false;

    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      metricsCollector.trackConnectorRequest(
        this.type,
        Date.now() - startedAt,
        response.ok
      );
      requestTracked = true;

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `SharePoint Graph request failed (${response.status}): ${text.slice(0, 300)}`
        );
      }

      const payload = await response.json();
      if (!schema) {
        return payload as T;
      }

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          `SharePoint response validation failed: ${summarizeSchemaError(parsed.error)}`
        );
      }

      return parsed.data;
    } catch (error) {
      if (!requestTracked) {
        metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
      }
      throw error;
    }
  }

  private normalizeFolderPath(folderPath: string): string {
    return folderPath
      .split("/")
      .filter(Boolean)
      .map((segment: string) => encodeURIComponent(segment))
      .join("/");
  }
}

class JiraAdapter implements ConnectorAdapter {
  type: ConnectorType = "jira";

  async connect(_integrationId: string): Promise<boolean> {
    return true;
  }

  async listItems(config: any): Promise<ConnectorItem[]> {
    const baseUrl = this.normalizeBaseUrl(config.baseUrl || config.siteUrl);
    if (!baseUrl) {
      throw new Error("Jira connector missing baseUrl in scopeConfig");
    }

    const authHeader = this.buildAuthHeader(config);
    if (!authHeader) {
      throw new Error(
        "Jira connector requires email+apiToken or bearerToken in scopeConfig"
      );
    }

    const projectKeys: string[] = Array.isArray(config.projectKeys)
      ? config.projectKeys.filter(Boolean)
      : [];
    const issueTypes: string[] = Array.isArray(config.issueTypes)
      ? config.issueTypes.filter(Boolean)
      : [];
    const maxResults = Number(config.maxResults) > 0 ? Number(config.maxResults) : 100;

    const jqlParts: string[] = [];
    if (projectKeys.length > 0) {
      const encodedProjects = projectKeys
        .map((key) => `"${String(key).replace(/"/g, '\\"')}"`)
        .join(",");
      jqlParts.push(`project in (${encodedProjects})`);
    }
    if (issueTypes.length > 0) {
      const encodedTypes = issueTypes
        .map((type) => `"${String(type).replace(/"/g, '\\"')}"`)
        .join(",");
      jqlParts.push(`issuetype in (${encodedTypes})`);
    }

    const jql = `${jqlParts.join(" AND ")}${jqlParts.length ? " " : ""}ORDER BY updated DESC`;
    const fields = "summary,description,updated,issuetype,project";
    const url = `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(
      jql
    )}&maxResults=${maxResults}&fields=${encodeURIComponent(fields)}`;

    const startedAt = Date.now();
    let requestTracked = false;
    let data: JiraSearchResponse;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
        },
      });
      metricsCollector.trackConnectorRequest(
        this.type,
        Date.now() - startedAt,
        response.ok
      );
      requestTracked = true;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Jira search failed (${response.status}): ${errorText.slice(0, 300)}`
        );
      }

      const payload = await response.json();
      const parsed = jiraSearchResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          `Jira response validation failed: ${summarizeSchemaError(parsed.error)}`
        );
      }
      data = parsed.data;
    } catch (error) {
      if (!requestTracked) {
        metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
      }
      throw error;
    }

    return (data.issues || []).map((issue) => {
      const summary = issue.fields?.summary || issue.key;
      const description = this.extractJiraText(issue.fields?.description);
      const content = [
        `Issue: ${issue.key}`,
        `Summary: ${summary}`,
        description ? `Description:\n${description}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        id: issue.id,
        name: `${issue.key} - ${summary}`,
        type: "issue",
        externalUrl: `${baseUrl}/browse/${issue.key}`,
        lastModified: issue.fields?.updated
          ? new Date(issue.fields.updated)
          : undefined,
        content,
        metadata: {
          source: "jira",
          issueKey: issue.key,
          baseUrl,
        },
      } as ConnectorItem;
    });
  }

  async fetchItem(item: ConnectorItem, config?: any): Promise<string> {
    if (item.content) {
      return item.content;
    }

    const baseUrl = this.normalizeBaseUrl(config?.baseUrl || item.metadata?.baseUrl);
    const issueKey = item.metadata?.issueKey;
    const authHeader = this.buildAuthHeader(config || {});
    if (!baseUrl || !issueKey || !authHeader) {
      return item.name;
    }

    const startedAt = Date.now();
    let requestTracked = false;
    try {
      const response = await fetch(
        `${baseUrl}/rest/api/3/issue/${encodeURIComponent(
          issueKey
        )}?fields=summary,description`,
        {
          headers: {
            Accept: "application/json",
            Authorization: authHeader,
          },
        }
      );
      metricsCollector.trackConnectorRequest(
        this.type,
        Date.now() - startedAt,
        response.ok
      );
      requestTracked = true;

      if (!response.ok) {
        return item.name;
      }

      const payload = await response.json();
      const parsed = jiraIssueResponseSchema.safeParse(payload);
      if (!parsed.success) {
        logger.warn("Jira issue response validation failed", {
          issueKey,
          validationError: summarizeSchemaError(parsed.error),
        });
        return item.name;
      }

      const data: JiraIssueResponse = parsed.data;
      const summary = data.fields?.summary || issueKey;
      const description = this.extractJiraText(data.fields?.description);
      return [summary, description].filter(Boolean).join("\n\n");
    } catch (_error) {
      if (!requestTracked) {
        metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
      }
      return item.name;
    }
  }

  private buildAuthHeader(config: any): string | null {
    const email = config.email || config.username;
    const apiToken = config.apiToken;
    const bearerToken = config.bearerToken || config.token;

    if (email && apiToken) {
      const basic = Buffer.from(`${email}:${apiToken}`).toString("base64");
      return `Basic ${basic}`;
    }

    if (bearerToken) {
      return `Bearer ${bearerToken}`;
    }

    return null;
  }

  private normalizeBaseUrl(rawUrl?: string): string {
    if (!rawUrl || typeof rawUrl !== "string") {
      return "";
    }
    return rawUrl.replace(/\/+$/, "");
  }

  private extractJiraText(value: any): string {
    if (!value) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }

    const chunks: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (typeof node.text === "string") {
        chunks.push(node.text);
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          walk(child);
        }
      }
    };
    walk(value);
    return chunks.join(" ").trim();
  }
}

class NotionAdapter implements ConnectorAdapter {
  type: ConnectorType = "notion";

  async connect(_integrationId: string): Promise<boolean> {
    return true;
  }

  async listItems(config: any): Promise<ConnectorItem[]> {
    const token = this.getToken(config);
    if (!token) {
      throw new Error("Notion connector missing apiToken in scopeConfig");
    }

    const items: ConnectorItem[] = [];
    const pageIds = Array.isArray(config.pageIds)
      ? config.pageIds.filter(Boolean)
      : [];

    if (pageIds.length > 0) {
      for (const pageId of pageIds) {
        const page = await this.notionRequest<NotionPage>(
          token,
          `/v1/pages/${encodeURIComponent(pageId)}`,
          "GET",
          undefined,
          notionPageSchema
        );
        items.push(this.toConnectorItem(page));
      }
      return items;
    }

    const searchBody: Record<string, any> = {
      page_size: Number(config.maxResults) > 0 ? Number(config.maxResults) : 100,
      filter: { value: "page", property: "object" },
    };
    if (typeof config.query === "string" && config.query.trim()) {
      searchBody.query = config.query.trim();
    }

    const response = await this.notionRequest<NotionSearchResponse>(
      token,
      "/v1/search",
      "POST",
      searchBody,
      notionSearchResponseSchema
    );

    for (const pageCandidate of response.results || []) {
      if ((pageCandidate as any)?.object !== "page") {
        continue;
      }

      const page = notionPageSchema.safeParse(pageCandidate);
      if (!page.success) {
        logger.warn("Notion page skipped due to schema validation failure", {
          validationError: summarizeSchemaError(page.error),
        });
        continue;
      }
      items.push(this.toConnectorItem(page.data));
    }

    return items;
  }

  async fetchItem(item: ConnectorItem, config?: any): Promise<string> {
    if (item.content) {
      return item.content;
    }

    const token = this.getToken(config || {});
    if (!token) {
      return item.name;
    }

    const pageId = item.metadata?.pageId || item.id;
    const blocksText = await this.getPageBlocksText(token, pageId);
    return blocksText || item.name;
  }

  private toConnectorItem(page: NotionPage): ConnectorItem {
    const pageId = page.id;
    const title = this.getPageTitle(page) || `Notion Page ${pageId}`;
    return {
      id: pageId,
      name: title,
      type: "page",
      externalUrl: page.url || "",
      lastModified: page.last_edited_time
        ? new Date(page.last_edited_time)
        : undefined,
      metadata: {
        source: "notion",
        pageId,
      },
    };
  }

  private getToken(config: any): string | null {
    const token = config.apiToken || config.notionToken || config.token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  }

  private getPageTitle(page: NotionPage): string {
    const titleProp = page?.properties
      ? Object.values(page.properties).find(
          (property: any) => property?.type === "title"
        )
      : null;
    const titleArray = (titleProp as any)?.title;
    if (Array.isArray(titleArray) && titleArray.length > 0) {
      return titleArray.map((node: any) => node?.plain_text || "").join("").trim();
    }
    return "";
  }

  private async getPageBlocksText(token: string, blockId: string): Promise<string> {
    let cursor: string | undefined;
    const segments: string[] = [];

    do {
      const query = cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : "";
      const response = await this.notionRequest<NotionBlocksResponse>(
        token,
        `/v1/blocks/${encodeURIComponent(blockId)}/children${query}`,
        "GET",
        undefined,
        notionBlocksResponseSchema
      );

      for (const block of response.results || []) {
        const richText = (block as any)?.[(block as any)?.type]?.rich_text;
        if (Array.isArray(richText)) {
          const line = richText
            .map((entry: any) => entry?.plain_text || "")
            .join("")
            .trim();
          if (line) {
            segments.push(line);
          }
        }
      }

      cursor = response.has_more ? response.next_cursor || undefined : undefined;
    } while (cursor);

    return segments.join("\n").trim();
  }

  private async notionRequest<T>(
    token: string,
    path: string,
    method: "GET" | "POST" = "GET",
    body?: Record<string, any>,
    schema?: z.ZodType<T>
  ): Promise<T> {
    const startedAt = Date.now();
    let requestTracked = false;

    try {
      const response = await fetch(`https://api.notion.com${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          Accept: "application/json",
          ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        },
        ...(method === "POST" ? { body: JSON.stringify(body || {}) } : {}),
      });

      metricsCollector.trackConnectorRequest(
        this.type,
        Date.now() - startedAt,
        response.ok
      );
      requestTracked = true;

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Notion API request failed (${response.status}): ${text.slice(0, 300)}`
        );
      }

      const payload = await response.json();
      if (!schema) {
        return payload as T;
      }

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          `Notion response validation failed: ${summarizeSchemaError(parsed.error)}`
        );
      }

      return parsed.data;
    } catch (error) {
      if (!requestTracked) {
        metricsCollector.trackConnectorRequest(this.type, Date.now() - startedAt, false);
      }
      throw error;
    }
  }
}

class ConnectorService {
  private adapters: Map<ConnectorType, ConnectorAdapter> = new Map();

  constructor() {
    this.registerAdapter(
      new SharePointAdapter(this.getIntegrationAccessToken.bind(this))
    );
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

  async createConfig(
    userId: string,
    orgId: string,
    integrationId: string,
    name: string,
    type: ConnectorType,
    scopeConfig: any,
    ipAddress: string = "unknown"
  ) {
    const [config] = await db
      .insert(connectorConfigs)
      .values({
        integrationId,
        organizationId: orgId,
        name,
        connectorType: type,
        scopeConfig,
        syncMode: "manual",
      })
      .returning();

    await auditService.logEvent({
      organizationId: orgId,
      userId,
      action: AuditAction.CREATE,
      resourceType: "connector_config",
      resourceId: config.id,
      ipAddress,
      details: { name, type },
    });

    return this.sanitizeConfig(config);
  }

  private sanitizeConfig(config: any) {
    if (!config) return null;

    const secretKeys = [
      "token",
      "password",
      "clientsecret",
      "apikey",
      "secret",
      "authorization",
      "bearer",
    ];

    const redact = (value: any): any => {
      if (Array.isArray(value)) {
        return value.map(redact);
      }
      if (value && typeof value === "object") {
        const redactedEntries = Object.entries(value).map(([key, fieldValue]) => {
          if (secretKeys.some((secretKey) => key.toLowerCase().includes(secretKey))) {
            return [key, "********"] as const;
          }

          return [key, redact(fieldValue)] as const;
        });
        return Object.fromEntries(redactedEntries);
      }
      return value;
    };

    return {
      ...config,
      scopeConfig: config.scopeConfig ? redact(config.scopeConfig) : config.scopeConfig,
    };
  }

  async getConfigs(orgId: string) {
    const configs = await db
      .select()
      .from(connectorConfigs)
      .where(eq(connectorConfigs.organizationId, orgId));
    return configs.map((config) => this.sanitizeConfig(config));
  }

  async runImport(
    userId: string,
    orgId: string,
    configId: string,
    snapshotId: string | undefined,
    ipAddress: string = "unknown"
  ) {
    const [config] = await db
      .select()
      .from(connectorConfigs)
      .where(
        and(
          eq(connectorConfigs.id, configId),
          eq(connectorConfigs.organizationId, orgId)
        )
      );
    if (!config) throw new Error("Connector config not found");

    const adapter = this.getAdapter(config.connectorType as ConnectorType);

    if (!snapshotId) {
      throw new Error("Snapshot ID is required for import");
    }

    const executionConfig = {
      ...(config.scopeConfig || {}),
      integrationId: config.integrationId,
    };

    await auditService.logEvent({
      organizationId: config.organizationId,
      userId,
      action: AuditAction.UPDATE,
      resourceType: "connector_import",
      resourceId: configId,
      ipAddress,
      details: { status: "started", snapshotId },
    });

    try {
      const items = await adapter.listItems(executionConfig);
      let importedCount = 0;

      for (const item of items) {
        if (item.type === "folder") {
          continue;
        }

        const content = await adapter.fetchItem(item, executionConfig);
        const fileBuffer =
          typeof content === "string"
            ? Buffer.from(content, "utf8")
            : Buffer.from(content);
        const fileName = this.getImportFileName(item);

        await ingestionService.ingestFile({
          fileName,
          file: fileBuffer,
          snapshotId,
          category: "Evidence",
          organizationId: config.organizationId,
          userId,
        });
        importedCount++;
      }

      await db
        .update(connectorConfigs)
        .set({ lastSnapshotId: snapshotId, lastSyncedAt: new Date() })
        .where(
          and(
            eq(connectorConfigs.id, configId),
            eq(connectorConfigs.organizationId, orgId)
          )
        );

      await auditService.logEvent({
        organizationId: config.organizationId,
        userId,
        action: AuditAction.UPDATE,
        resourceType: "connector_import",
        resourceId: configId,
        ipAddress,
        details: {
          status: "completed",
          imported: importedCount,
          discovered: items.length,
        },
      });
    } catch (error: any) {
      await auditService.logEvent({
        organizationId: config.organizationId,
        userId,
        action: AuditAction.UPDATE,
        resourceType: "connector_import",
        resourceId: configId,
        ipAddress,
        details: { status: "failed", error: error?.message || "Unknown error" },
      });
      throw error;
    }
  }

  private getImportFileName(item: ConnectorItem): string {
    const rawName = (item.name || `import-${item.id}`).trim();
    const withoutReservedChars = rawName.replace(/[<>:"/\\|?*]/g, "_");
    const sanitized = Array.from(withoutReservedChars, (char) =>
      char.charCodeAt(0) < 32 ? "_" : char
    ).join("");
    const hasExtension = /\.[a-z0-9]{1,8}$/i.test(sanitized);

    if (item.type === "file" || hasExtension) {
      return sanitized;
    }
    return `${sanitized}.txt`;
  }

  private async getIntegrationAccessToken(
    integrationId: string
  ): Promise<string> {
    const [integration] = await db
      .select()
      .from(cloudIntegrations)
      .where(eq(cloudIntegrations.id, integrationId));

    if (!integration) {
      throw new Error(`Cloud integration ${integrationId} not found`);
    }

    const encryptedData =
      typeof integration.accessTokenEncrypted === "string"
        ? JSON.parse(integration.accessTokenEncrypted)
        : integration.accessTokenEncrypted;

    return await encryptionService.decryptSensitiveField(
      encryptedData,
      DataClassification.RESTRICTED
    );
  }
}

export const connectorService = new ConnectorService();
