import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectorService,
  type ConnectorAdapter,
  type ConnectorItem,
} from "../../server/services/connectorService";
import { ingestionService } from "../../server/services/ingestionService";
import { auditService } from "../../server/services/auditService";

const mockedDbFns = vi.hoisted(() => {
  const whereMock = vi.fn();
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const insertReturningMock = vi.fn();
  const insertValuesMock = vi.fn(() => ({ returning: insertReturningMock }));
  const insertMock = vi.fn(() => ({ values: insertValuesMock }));
  const updateWhereMock = vi.fn();
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));

  return {
    whereMock,
    fromMock,
    selectMock,
    insertReturningMock,
    insertValuesMock,
    insertMock,
    updateWhereMock,
    updateSetMock,
    updateMock,
  };
});

vi.mock("../../server/db", () => ({
  db: {
    select: mockedDbFns.selectMock,
    update: mockedDbFns.updateMock,
    insert: mockedDbFns.insertMock,
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

describe("connectorService.runImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when connector config cannot be found in org scope", async () => {
    mockedDbFns.whereMock.mockResolvedValueOnce([]);

    await expect(
      connectorService.runImport("user-1", "org-1", "cfg-1", "snap-1")
    ).rejects.toThrow("Connector config not found");
  });

  it("throws when snapshot ID is missing", async () => {
    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-1",
        organizationId: "org-1",
        connectorType: "jira",
        integrationId: "int-1",
        scopeConfig: {},
      },
    ]);

    await expect(
      connectorService.runImport("user-1", "org-1", "cfg-1", undefined)
    ).rejects.toThrow("Snapshot ID is required for import");
  });

  it("imports text-based connector items as .txt files", async () => {
    const adapter: ConnectorAdapter = {
      type: "jira",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => [
        {
          id: "issue-1",
          name: "ENG-100 hardening task",
          type: "issue",
          externalUrl: "https://jira.example.com/browse/ENG-100",
        } satisfies ConnectorItem,
      ]),
      fetchItem: vi.fn(async () => "Issue body"),
    };

    connectorService.registerAdapter(adapter);

    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-1",
        organizationId: "org-1",
        connectorType: "jira",
        integrationId: "int-1",
        scopeConfig: { projectKeys: ["ENG"] },
      },
    ]);
    mockedDbFns.updateWhereMock.mockResolvedValueOnce(undefined);
    vi.mocked(ingestionService.ingestFile).mockResolvedValueOnce({ id: "file-1" } as any);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await connectorService.runImport("user-1", "org-1", "cfg-1", "snap-1");

    expect(adapter.listItems).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationId: "int-1",
      })
    );
    expect(ingestionService.ingestFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "ENG-100 hardening task.txt",
        snapshotId: "snap-1",
        organizationId: "org-1",
      })
    );
    expect(auditService.logEvent).toHaveBeenCalledTimes(2);
    expect(mockedDbFns.updateMock).toHaveBeenCalledTimes(1);
  });

  it("preserves file extension for binary file items", async () => {
    const adapter: ConnectorAdapter = {
      type: "sharepoint",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => [
        {
          id: "file-1",
          name: "control-mapping.pdf",
          type: "file",
          externalUrl: "https://sharepoint.example.com/file-1",
        } satisfies ConnectorItem,
      ]),
      fetchItem: vi.fn(async () => Buffer.from("pdf-bytes")),
    };

    connectorService.registerAdapter(adapter);

    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-2",
        organizationId: "org-1",
        connectorType: "sharepoint",
        integrationId: "int-1",
        scopeConfig: { siteId: "site-1" },
      },
    ]);
    mockedDbFns.updateWhereMock.mockResolvedValueOnce(undefined);
    vi.mocked(ingestionService.ingestFile).mockResolvedValueOnce({ id: "file-2" } as any);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await connectorService.runImport("user-1", "org-1", "cfg-2", "snap-2");

    expect(ingestionService.ingestFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "control-mapping.pdf",
        snapshotId: "snap-2",
      })
    );
  });

  it("skips folder items and sanitizes unsafe names for text import", async () => {
    const adapter: ConnectorAdapter = {
      type: "notion",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => [
        {
          id: "folder-1",
          name: "Folder Node",
          type: "folder",
          externalUrl: "https://notion.example.com/folder",
        } satisfies ConnectorItem,
        {
          id: "doc-1",
          name: "Control:<Plan>?",
          type: "page",
          externalUrl: "https://notion.example.com/doc",
        } satisfies ConnectorItem,
      ]),
      fetchItem: vi.fn(async () => "Notion page content"),
    };

    connectorService.registerAdapter(adapter);

    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-3",
        organizationId: "org-1",
        connectorType: "notion",
        integrationId: "int-1",
        scopeConfig: { pageIds: ["doc-1"] },
      },
    ]);
    mockedDbFns.updateWhereMock.mockResolvedValueOnce(undefined);
    vi.mocked(ingestionService.ingestFile).mockResolvedValueOnce({ id: "file-3" } as any);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await connectorService.runImport("user-1", "org-1", "cfg-3", "snap-3");

    expect(ingestionService.ingestFile).toHaveBeenCalledTimes(1);
    expect(ingestionService.ingestFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "Control__Plan__.txt",
      })
    );
  });

  it("logs failed import attempts and rethrows adapter errors", async () => {
    const adapter: ConnectorAdapter = {
      type: "jira",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => {
        throw new Error("upstream unavailable");
      }),
      fetchItem: vi.fn(async () => "unused"),
    };

    connectorService.registerAdapter(adapter);

    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-4",
        organizationId: "org-1",
        connectorType: "jira",
        integrationId: "int-1",
        scopeConfig: { projectKeys: ["ENG"] },
      },
    ]);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await expect(
      connectorService.runImport("user-1", "org-1", "cfg-4", "snap-4")
    ).rejects.toThrow("upstream unavailable");

    expect(auditService.logEvent).toHaveBeenCalledTimes(2);
    expect(auditService.logEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ status: "failed" }),
      })
    );
  });

  it("throws when connector type has no registered adapter", async () => {
    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-5",
        organizationId: "org-1",
        connectorType: "unknown",
        integrationId: "int-1",
        scopeConfig: {},
      },
    ]);

    await expect(
      connectorService.runImport("user-1", "org-1", "cfg-5", "snap-5")
    ).rejects.toThrow("Adapter for unknown not found");
  });

  it("uses fallback names and strips control characters during import", async () => {
    const adapter: ConnectorAdapter = {
      type: "notion",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => [
        {
          id: "untitled-1",
          name: "",
          type: "page",
          externalUrl: "https://notion.example.com/untitled-1",
        } satisfies ConnectorItem,
        {
          id: "strange-2",
          name: "Bad\u0001Name.md",
          type: "page",
          externalUrl: "https://notion.example.com/strange-2",
        } satisfies ConnectorItem,
      ]),
      fetchItem: vi.fn(async (item) => `content:${item.id}`),
    };

    connectorService.registerAdapter(adapter);
    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-6",
        organizationId: "org-1",
        connectorType: "notion",
        integrationId: "int-1",
        scopeConfig: undefined,
      },
    ]);
    mockedDbFns.updateWhereMock.mockResolvedValueOnce(undefined);
    vi.mocked(ingestionService.ingestFile)
      .mockResolvedValueOnce({ id: "file-a" } as any)
      .mockResolvedValueOnce({ id: "file-b" } as any);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await connectorService.runImport("user-1", "org-1", "cfg-6", "snap-6");

    expect(ingestionService.ingestFile).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ fileName: "import-untitled-1.txt" })
    );
    expect(ingestionService.ingestFile).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ fileName: "Bad_Name.md" })
    );
  });

  it("records unknown adapter errors when a non-Error is thrown", async () => {
    const adapter: ConnectorAdapter = {
      type: "jira",
      connect: vi.fn(async () => true),
      listItems: vi.fn(async () => {
        throw {};
      }),
      fetchItem: vi.fn(async () => "unused"),
    };

    connectorService.registerAdapter(adapter);
    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-7",
        organizationId: "org-1",
        connectorType: "jira",
        integrationId: "int-1",
        scopeConfig: {},
      },
    ]);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    await expect(
      connectorService.runImport("user-1", "org-1", "cfg-7", "snap-7")
    ).rejects.toEqual({});

    expect(auditService.logEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ error: "Unknown error" }),
      })
    );
  });
});

describe("connectorService config management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates configs and redacts secrets in returned scope config", async () => {
    mockedDbFns.insertReturningMock.mockResolvedValueOnce([
      {
        id: "cfg-10",
        organizationId: "org-1",
        integrationId: "int-1",
        name: "Jira Import",
        connectorType: "jira",
        scopeConfig: {
          baseUrl: "https://jira.example.com",
          apiToken: "super-secret-token",
          nested: { bearerToken: "secret-bearer" },
        },
      },
    ]);
    vi.mocked(auditService.logEvent).mockResolvedValue(undefined);

    const result = await connectorService.createConfig(
      "user-1",
      "org-1",
      "int-1",
      "Jira Import",
      "jira",
      {
        baseUrl: "https://jira.example.com",
        apiToken: "super-secret-token",
      },
      "127.0.0.1"
    );

    expect(result.scopeConfig.apiToken).toBe("********");
    expect(result.scopeConfig.nested.bearerToken).toBe("********");
    expect(auditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        resourceType: "connector_config",
      })
    );
  });

  it("redacts secrets when listing configs", async () => {
    mockedDbFns.whereMock.mockResolvedValueOnce([
      {
        id: "cfg-11",
        organizationId: "org-1",
        scopeConfig: {
          username: "kevin",
          password: "hidden",
          nested: {
            token: "hide-me",
            keep: "visible",
          },
        },
      },
    ]);

    const configs = await connectorService.getConfigs("org-1");

    expect(configs).toHaveLength(1);
    expect(configs[0].scopeConfig.password).toBe("********");
    expect(configs[0].scopeConfig.nested.token).toBe("********");
    expect(configs[0].scopeConfig.nested.keep).toBe("visible");
  });

  it("handles null and undefined scope config while listing configs", async () => {
    mockedDbFns.whereMock.mockResolvedValueOnce([
      null,
      {
        id: "cfg-12",
        organizationId: "org-1",
        scopeConfig: undefined,
      },
      {
        id: "cfg-13",
        organizationId: "org-1",
        scopeConfig: {
          allowedProjects: ["A", "B"],
          credentials: [{ bearerToken: "hidden" }],
        },
      },
    ]);

    const configs = await connectorService.getConfigs("org-1");

    expect(configs[0]).toBeNull();
    expect(configs[1].scopeConfig).toBeUndefined();
    expect(configs[2].scopeConfig.allowedProjects).toEqual(["A", "B"]);
    expect(configs[2].scopeConfig.credentials[0].bearerToken).toBe("********");
  });
});
