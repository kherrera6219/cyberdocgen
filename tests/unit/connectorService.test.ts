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
  const updateWhereMock = vi.fn();
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));

  return {
    whereMock,
    fromMock,
    selectMock,
    updateWhereMock,
    updateSetMock,
    updateMock,
  };
});

vi.mock("../../server/db", () => ({
  db: {
    select: mockedDbFns.selectMock,
    update: mockedDbFns.updateMock,
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
});
