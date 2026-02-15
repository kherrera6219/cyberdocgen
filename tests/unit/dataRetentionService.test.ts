import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataRetentionService } from "../../server/services/dataRetentionService";
import { db } from "../../server/db";
import { logger } from "../../server/utils/logger";

const mockDb = vi.hoisted(() => {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve([])),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([])),
  };
  return chain;
});

vi.mock("../../server/db", () => ({
  db: mockDb,
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../shared/schema", () => ({
  dataRetentionPolicies: {
    id: "id",
    organizationId: "organizationId",
    policyName: "policyName",
    dataType: "dataType",
    retentionDays: "retentionDays",
    status: "status",
    updatedAt: "updatedAt",
    lastEnforcedAt: "lastEnforcedAt",
  },
  documents: { id: "id", companyProfileId: "companyProfileId", createdAt: "createdAt" },
  companyProfiles: { id: "id", organizationId: "organizationId" },
  aiGuardrailsLogs: { organizationId: "organizationId", createdAt: "createdAt" },
  auditLogs: { organizationId: "organizationId", timestamp: "timestamp" },
  cloudFiles: { organizationId: "organizationId", createdAt: "createdAt" },
  documentVersions: { id: "id", documentId: "documentId", createdAt: "createdAt" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  and: vi.fn((...parts: unknown[]) => ({ parts })),
  lt: vi.fn(() => "lt"),
  inArray: vi.fn(() => "inArray"),
}));

describe("DataRetentionService", () => {
  let service: DataRetentionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DataRetentionService();

    mockDb.select.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.delete.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockResolvedValue([]);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.returning.mockResolvedValue([]);
  });

  it("creates a policy with defaults", async () => {
    const createdPolicy = {
      id: "policy-1",
      organizationId: "org-1",
      policyName: "Docs Policy",
      dataType: "documents",
      retentionDays: 30,
      deleteAfterExpiry: true,
      archiveBeforeDelete: true,
      status: "active",
      createdBy: "user-1",
    };
    mockDb.returning.mockResolvedValueOnce([createdPolicy]);

    const result = await service.createPolicy({
      organizationId: "org-1",
      policyName: "Docs Policy",
      dataType: "documents",
      retentionDays: 30,
      createdBy: "user-1",
    });

    expect(result).toEqual(createdPolicy);
    expect(db.insert).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it("fetches organization policies", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "policy-1" }]);

    const result = await service.getPoliciesByOrganization("org-1");
    expect(result).toEqual([{ id: "policy-1" }]);
  });

  it("fetches active policies for an organization", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "policy-active" }]);

    const result = await service.getActivePolicies("org-1");
    expect(result).toEqual([{ id: "policy-active" }]);
  });

  it("returns null when getPolicyForDataType query fails", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("db unavailable");
    });

    const result = await service.getPolicyForDataType("org-1", "documents");
    expect(result).toBeNull();
  });

  it("returns retain=true when no policy exists", async () => {
    vi.spyOn(service, "getPolicyForDataType").mockResolvedValueOnce(null);

    const result = await service.shouldRetain(
      "org-1",
      "documents",
      new Date("2026-01-01")
    );
    expect(result).toEqual({ retain: true });
  });

  it("returns retain=true with days remaining when policy still valid", async () => {
    vi.spyOn(service, "getPolicyForDataType").mockResolvedValueOnce({
      id: "policy-1",
      organizationId: "org-1",
      policyName: "docs",
      dataType: "documents",
      retentionDays: 30,
      deleteAfterExpiry: true,
      archiveBeforeDelete: true,
      status: "active",
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 5);

    const result = await service.shouldRetain("org-1", "documents", createdAt);

    expect(result.retain).toBe(true);
    expect(result.daysRemaining).toBeGreaterThan(20);
  });

  it("fails safe with retain=true when shouldRetain throws", async () => {
    vi.spyOn(service, "getPolicyForDataType").mockRejectedValueOnce(
      new Error("lookup failed")
    );

    const result = await service.shouldRetain(
      "org-1",
      "documents",
      new Date("2025-01-01")
    );
    expect(result).toEqual({ retain: true });
  });

  it.each([
    "documents",
    "ai_guardrails_logs",
    "audit_logs",
    "cloud_files",
    "document_versions",
  ])(
    "enforces %s policy and deletes expired records when deleteAfterExpiry=true",
    async (dataType) => {
      mockDb.where
        .mockResolvedValueOnce([{ id: "old-1" }, { id: "old-2" }])
        .mockResolvedValueOnce({ rowCount: 2 });

      const result = await (service as any).enforcePolicyForDataType({
        id: "policy-1",
        organizationId: "org-1",
        policyName: `${dataType} policy`,
        dataType,
        retentionDays: 30,
        deleteAfterExpiry: true,
      });

      expect(result).toEqual({ archived: 0, deleted: 2 });
      expect(db.delete).toHaveBeenCalled();
    }
  );

  it("enforces policy with archive mode (deleteAfterExpiry=false)", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "old-1" }]);

    const result = await (service as any).enforcePolicyForDataType({
      id: "policy-archive",
      organizationId: "org-1",
      policyName: "docs archive",
      dataType: "documents",
      retentionDays: 30,
      deleteAfterExpiry: false,
    });

    expect(result).toEqual({ archived: 1, deleted: 0 });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("logs warning for unknown policy data type", async () => {
    const result = await (service as any).enforcePolicyForDataType({
      id: "policy-unknown",
      organizationId: "org-1",
      policyName: "unknown",
      dataType: "nonexistent_type",
      retentionDays: 30,
      deleteAfterExpiry: true,
    });

    expect(result).toEqual({ archived: 0, deleted: 0 });
    expect(logger.warn).toHaveBeenCalled();
  });

  it("aggregates enforcement counts and tracks per-policy failures", async () => {
    vi.spyOn(service, "getActivePolicies").mockResolvedValueOnce([
      { id: "p1", dataType: "documents" },
      { id: "p2", dataType: "cloud_files" },
    ] as any);
    vi.spyOn(service as any, "enforcePolicyForDataType")
      .mockResolvedValueOnce({ archived: 2, deleted: 3 })
      .mockRejectedValueOnce(new Error("policy failed"));
    mockDb.where.mockResolvedValue({ rowCount: 1 });

    const result = await service.enforceRetentionPolicies("org-1");

    expect(result).toEqual({ archived: 2, deleted: 3, errors: 1 });
    expect(db.update).toHaveBeenCalled();
  });

  it("throws wrapped error when policy enforcement bootstrap fails", async () => {
    vi.spyOn(service, "getActivePolicies").mockRejectedValueOnce(
      new Error("cannot load policies")
    );

    await expect(service.enforceRetentionPolicies("org-1")).rejects.toThrow(
      "Failed to enforce retention policies: cannot load policies"
    );
  });

  it("updates policy status and wraps errors", async () => {
    mockDb.where.mockResolvedValueOnce({ rowCount: 1 });
    await expect(
      service.updatePolicyStatus("policy-1", "inactive")
    ).resolves.toBeUndefined();

    mockDb.update.mockImplementationOnce(() => {
      throw new Error("update failed");
    });
    await expect(service.updatePolicyStatus("policy-1", "active")).rejects.toThrow(
      "Failed to update policy status: update failed"
    );
  });

  it("deletes policy by delegating to inactive status", async () => {
    const statusSpy = vi
      .spyOn(service, "updatePolicyStatus")
      .mockResolvedValueOnce(undefined);

    await service.deletePolicy("policy-1");
    expect(statusSpy).toHaveBeenCalledWith("policy-1", "inactive");
  });
});
