import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectorService } from "../../server/services/connectorService";

const mockedDbFns = vi.hoisted(() => {
  const whereMock = vi.fn();
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));

  return {
    whereMock,
    fromMock,
    selectMock,
  };
});

vi.mock("../../server/db", () => ({
  db: {
    select: mockedDbFns.selectMock,
    update: vi.fn(),
    insert: vi.fn(),
    query: {},
  },
}));

vi.mock("../../server/services/ingestionService", () => ({
  ingestionService: {
    ingestFile: vi.fn(),
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logEvent: vi.fn(),
  },
  AuditAction: {
    CREATE: "create",
    UPDATE: "update",
  },
}));

vi.mock("../../server/services/encryption", () => ({
  encryptionService: {
    decryptSensitiveField: vi.fn().mockResolvedValue("access-token"),
  },
  DataClassification: {
    RESTRICTED: "restricted",
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Connector adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDbFns.whereMock.mockResolvedValue([
      {
        id: "int-1",
        accessTokenEncrypted: JSON.stringify({ iv: "iv", content: "enc" }),
      },
    ]);
  });

  describe("SharePoint adapter", () => {
    it("validates required integrationId and siteId", async () => {
      const adapter = connectorService.getAdapter("sharepoint");

      await expect(adapter.listItems({ siteId: "site-1" })).rejects.toThrow(
        "SharePoint connector missing integrationId"
      );
      await expect(adapter.listItems({ integrationId: "int-1" })).rejects.toThrow(
        "SharePoint connector missing siteId in scopeConfig"
      );
    });

    it("lists only file entries and normalizes folder paths", async () => {
      const adapter = connectorService.getAdapter("sharepoint");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            json: async () => ({
              value: [
                {
                  id: "file-1",
                  name: "evidence.pdf",
                  file: { mimeType: "application/pdf" },
                  webUrl: "https://sharepoint.example/file-1",
                  lastModifiedDateTime: new Date("2026-01-01").toISOString(),
                  "@microsoft.graph.downloadUrl":
                    "https://sharepoint.example/download/file-1",
                },
                {
                  id: "folder-1",
                  name: "Folder",
                  folder: { childCount: 3 },
                },
              ],
            }),
          }) as any
        )
      );

      const items = await adapter.listItems({
        integrationId: "int-1",
        siteId: "site-1",
        folderPaths: ["Controls/Policies"],
      });

      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(
        expect.objectContaining({
          id: "file-1",
          type: "file",
          metadata: expect.objectContaining({
            folderPath: "Controls/Policies",
          }),
        })
      );
    });

    it("downloads item bytes from direct download URL", async () => {
      const adapter = connectorService.getAdapter("sharepoint");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            arrayBuffer: async () => new TextEncoder().encode("pdf-bytes").buffer,
          }) as any
        )
      );

      const bytes = await adapter.fetchItem({
        id: "file-1",
        name: "evidence.pdf",
        type: "file",
        externalUrl: "https://sharepoint.example/file-1",
        downloadUrl: "https://sharepoint.example/download/file-1",
      });

      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.toString("utf8")).toBe("pdf-bytes");
    });

    it("fetches item content through Graph when no direct download URL exists", async () => {
      const adapter = connectorService.getAdapter("sharepoint");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            arrayBuffer: async () => new TextEncoder().encode("graph-bytes").buffer,
          }) as any
        )
      );

      const bytes = await adapter.fetchItem(
        {
          id: "file-2",
          name: "policy.docx",
          type: "file",
          externalUrl: "https://sharepoint.example/file-2",
        },
        {
          integrationId: "int-1",
          siteId: "site-1",
        }
      );

      expect(bytes.toString("utf8")).toBe("graph-bytes");
    });

    it("throws when Graph fetch cannot resolve integration and site IDs", async () => {
      const adapter = connectorService.getAdapter("sharepoint");

      await expect(
        adapter.fetchItem({
          id: "file-3",
          name: "missing-ids.docx",
          type: "file",
          externalUrl: "https://sharepoint.example/file-3",
        })
      ).rejects.toThrow("SharePoint fetch requires integrationId and siteId");
    });
  });

  describe("Jira adapter", () => {
    it("validates required base URL and auth settings", async () => {
      const adapter = connectorService.getAdapter("jira");

      await expect(adapter.listItems({})).rejects.toThrow(
        "Jira connector missing baseUrl in scopeConfig"
      );
      await expect(adapter.listItems({ baseUrl: "https://jira.example.com" })).rejects.toThrow(
        "Jira connector requires email+apiToken or bearerToken in scopeConfig"
      );
    });

    it("maps Jira issues into connector items and reuses embedded content", async () => {
      const adapter = connectorService.getAdapter("jira");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            json: async () => ({
              issues: [
                {
                  id: "1001",
                  key: "SEC-100",
                  fields: {
                    summary: "Rotate keys",
                    updated: new Date("2026-01-02").toISOString(),
                    description: {
                      type: "doc",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Rotation runbook." }],
                        },
                      ],
                    },
                  },
                },
              ],
            }),
          }) as any
        )
      );

      const items = await adapter.listItems({
        baseUrl: "https://jira.example.com/",
        email: "user@example.com",
        apiToken: "api-token",
        projectKeys: ["SEC"],
        issueTypes: ["Task"],
      });

      expect(items).toHaveLength(1);
      expect(items[0].name).toContain("SEC-100");
      expect(items[0].content).toContain("Rotation runbook.");

      const content = await adapter.fetchItem(items[0], {});
      expect(content).toContain("Rotation runbook.");
    });

    it("rejects Jira responses that fail runtime schema validation", async () => {
      const adapter = connectorService.getAdapter("jira");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            json: async () => ({
              issues: [{ key: "SEC-200" }],
            }),
          }) as any
        )
      );

      await expect(
        adapter.listItems({
          baseUrl: "https://jira.example.com",
          bearerToken: "token",
        })
      ).rejects.toThrow("Jira response validation failed");
    });

    it("falls back to item name when Jira fetch cannot build request", async () => {
      const adapter = connectorService.getAdapter("jira");

      const content = await adapter.fetchItem(
        {
          id: "1002",
          name: "Fallback item",
          type: "issue",
          externalUrl: "https://jira.example.com/browse/SEC-101",
          metadata: { issueKey: "SEC-101" },
        },
        {}
      );

      expect(content).toBe("Fallback item");
    });
  });

  describe("Notion adapter", () => {
    it("validates required API token", async () => {
      const adapter = connectorService.getAdapter("notion");
      await expect(adapter.listItems({})).rejects.toThrow(
        "Notion connector missing apiToken in scopeConfig"
      );
    });

    it("lists pages by explicit pageIds and fetches page block content", async () => {
      const adapter = connectorService.getAdapter("notion");

      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/v1/pages/")) {
            return {
              ok: true,
              json: async () => ({
                object: "page",
                id: "page-1",
                url: "https://notion.so/page-1",
                last_edited_time: new Date("2026-01-05").toISOString(),
                properties: {
                  Title: {
                    type: "title",
                    title: [{ plain_text: "Policy Page" }],
                  },
                },
              }),
            } as any;
          }

          return {
            ok: true,
            json: async () => ({
              results: [
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ plain_text: "Notion control text" }],
                  },
                },
              ],
              has_more: false,
              next_cursor: null,
            }),
          } as any;
        })
      );

      const items = await adapter.listItems({
        apiToken: "notion-token",
        pageIds: ["page-1"],
      });
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Policy Page");

      const text = await adapter.fetchItem(items[0], { apiToken: "notion-token" });
      expect(text).toContain("Notion control text");
    });

    it("uses search endpoint and filters non-page objects", async () => {
      const adapter = connectorService.getAdapter("notion");

      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            json: async () => ({
              results: [
                {
                  object: "page",
                  id: "page-2",
                  url: "https://notion.so/page-2",
                  last_edited_time: new Date("2026-01-07").toISOString(),
                  properties: {
                    Name: {
                      type: "title",
                      title: [{ plain_text: "Search Result Page" }],
                    },
                  },
                },
                { object: "database", id: "db-1" },
              ],
            }),
          }) as any
        )
      );

      const items = await adapter.listItems({
        apiToken: "notion-token",
        query: "policy",
      });

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("page-2");
    });

    it("rejects Notion search responses that fail runtime schema validation", async () => {
      const adapter = connectorService.getAdapter("notion");

      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          ({
            ok: true,
            json: async () => ({
              results: "invalid",
            }),
          }) as any
        )
      );

      await expect(
        adapter.listItems({
          apiToken: "notion-token",
          query: "policy",
        })
      ).rejects.toThrow("Notion response validation failed");
    });

    it("falls back to item name when fetchItem has no token", async () => {
      const adapter = connectorService.getAdapter("notion");
      const text = await adapter.fetchItem(
        {
          id: "page-3",
          name: "Fallback page name",
          type: "page",
          externalUrl: "https://notion.so/page-3",
        },
        {}
      );

      expect(text).toBe("Fallback page name");
    });
  });
});
