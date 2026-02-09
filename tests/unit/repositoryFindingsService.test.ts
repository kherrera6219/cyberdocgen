import { beforeEach, describe, expect, it, vi } from "vitest";
import { repositoryFindings, repositoryTasks } from "@shared/schema";
import { AppError, NotFoundError } from "../../server/utils/errorHandling";

const selectMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const logActionMock = vi.hoisted(() => vi.fn());

const insertReturningQueue = vi.hoisted(() => [] as any[]);
const updateReturningQueue = vi.hoisted(() => [] as any[]);
const deleteWhereQueue = vi.hoisted(() => [] as any[]);
const taskInsertState = vi.hoisted(() => ({ error: null as Error | null }));

const findingValuesMock = vi.hoisted(() => vi.fn());
const findingReturningMock = vi.hoisted(() => vi.fn());
const taskValuesMock = vi.hoisted(() => vi.fn());
const updateSetMock = vi.hoisted(() => vi.fn());
const updateWhereMock = vi.hoisted(() => vi.fn());
const updateReturningMock = vi.hoisted(() => vi.fn());
const deleteWhereMock = vi.hoisted(() => vi.fn());

vi.mock("../../server/db", () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logAction: logActionMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { RepositoryFindingsService } from "../../server/services/repositoryFindingsService";

function mockSimpleSelectResult(result: any) {
  selectMock.mockImplementationOnce(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(result)),
    })),
  }));
}

function mockInnerJoinResult(result: any) {
  selectMock.mockImplementationOnce(() => ({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  }));
}

function mockPagedFindingsResult(findings: any[]) {
  const offsetMock = vi.fn(() => Promise.resolve(findings));
  const limitMock = vi.fn(() => ({ offset: offsetMock }));
  const orderByMock = vi.fn(() => ({ limit: limitMock }));
  const whereMock = vi.fn(() => ({ orderBy: orderByMock }));

  selectMock.mockImplementationOnce(() => ({
    from: vi.fn(() => ({
      where: whereMock,
    })),
  }));

  return { whereMock, orderByMock, limitMock, offsetMock };
}

describe("RepositoryFindingsService", () => {
  let service: RepositoryFindingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RepositoryFindingsService();

    insertReturningQueue.length = 0;
    updateReturningQueue.length = 0;
    deleteWhereQueue.length = 0;
    taskInsertState.error = null;

    findingReturningMock.mockImplementation(() => Promise.resolve(insertReturningQueue.shift() ?? []));
    findingValuesMock.mockImplementation(() => ({ returning: findingReturningMock }));
    taskValuesMock.mockImplementation(() => {
      if (taskInsertState.error) {
        return Promise.reject(taskInsertState.error);
      }
      return Promise.resolve(undefined);
    });

    insertMock.mockImplementation((table: any) => {
      if (table === repositoryTasks) {
        return { values: taskValuesMock };
      }
      if (table === repositoryFindings) {
        return { values: findingValuesMock };
      }
      return { values: findingValuesMock };
    });

    updateReturningMock.mockImplementation(() => Promise.resolve(updateReturningQueue.shift() ?? []));
    updateWhereMock.mockImplementation(() => ({ returning: updateReturningMock }));
    updateSetMock.mockImplementation(() => ({ where: updateWhereMock }));
    updateMock.mockImplementation(() => ({ set: updateSetMock }));

    deleteWhereMock.mockImplementation(() => Promise.resolve(deleteWhereQueue.shift() ?? { rowCount: 0 }));
    deleteMock.mockImplementation(() => ({ where: deleteWhereMock }));

    logActionMock.mockResolvedValue(undefined);
  });

  it("creates findings and auto-creates tasks for fail and partial statuses", async () => {
    mockSimpleSelectResult([{ id: "snapshot-1", organizationId: "org-1" }]);
    insertReturningQueue.push(
      [
        {
          id: "finding-pass",
          snapshotId: "snapshot-1",
          controlId: "CC1.1",
          framework: "SOC2",
          status: "pass",
          confidenceLevel: "medium",
          summary: "Pass finding",
          recommendation: "No action",
          evidenceReferences: [],
        },
      ],
      [
        {
          id: "finding-fail",
          snapshotId: "snapshot-1",
          controlId: "CC6.1",
          framework: "SOC2",
          status: "fail",
          confidenceLevel: "high",
          summary: "Missing auth checks",
          recommendation: "Add role checks",
          evidenceReferences: [{ filePath: "server/auth.ts" }],
        },
      ],
      [
        {
          id: "finding-partial",
          snapshotId: "snapshot-1",
          controlId: "CC7.3",
          framework: "SOC2",
          status: "partial",
          confidenceLevel: "medium",
          summary: "Logging partial",
          recommendation: "Expand audit logs",
          evidenceReferences: [{ filePath: "server/audit.ts" }],
        },
      ],
    );

    const result = await service.createFindings(
      "snapshot-1",
      "org-1",
      [
        {
          controlId: "CC1.1",
          framework: "SOC2",
          status: "pass",
          confidenceLevel: "medium",
          signalType: "logging",
          summary: "Pass finding",
          details: {},
          evidenceReferences: [],
          recommendation: "No action",
          aiModel: "gpt-4",
        },
        {
          controlId: "CC6.1",
          framework: "SOC2",
          status: "fail",
          confidenceLevel: "high",
          signalType: "access_control",
          summary: "Missing auth checks",
          details: {},
          evidenceReferences: [{ filePath: "server/auth.ts" }],
          recommendation: "Add role checks",
          aiModel: "gpt-4",
        },
        {
          controlId: "CC7.3",
          framework: "SOC2",
          status: "partial",
          confidenceLevel: "medium",
          signalType: "logging",
          summary: "Logging partial",
          details: {},
          evidenceReferences: [{ filePath: "server/audit.ts" }],
          recommendation: "Expand audit logs",
          aiModel: "gpt-4",
        },
      ] as any,
      "user-1",
    );

    expect(result).toHaveLength(3);
    expect(insertMock).toHaveBeenCalledTimes(5);
    expect(taskValuesMock).toHaveBeenCalledTimes(2);
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        entityType: "repository_findings",
        organizationId: "org-1",
        metadata: expect.objectContaining({ findingsCreated: 3 }),
      }),
    );
  });

  it("does not fail finding creation when task creation fails", async () => {
    mockSimpleSelectResult([{ id: "snapshot-1", organizationId: "org-1" }]);
    insertReturningQueue.push([
      {
        id: "finding-fail",
        snapshotId: "snapshot-1",
        controlId: "CC6.1",
        framework: "SOC2",
        status: "fail",
        confidenceLevel: "high",
        summary: "Critical finding",
        recommendation: "Fix now",
        evidenceReferences: [{ filePath: "src/auth.ts" }],
      },
    ]);
    taskInsertState.error = new Error("task insert failed");

    const result = await service.createFindings(
      "snapshot-1",
      "org-1",
      [
        {
          controlId: "CC6.1",
          framework: "SOC2",
          status: "fail",
          confidenceLevel: "high",
          signalType: "access_control",
          summary: "Critical finding",
          details: {},
          evidenceReferences: [{ filePath: "src/auth.ts" }],
          recommendation: "Fix now",
          aiModel: "gpt-4",
        },
      ] as any,
      "user-1",
    );

    expect(result).toHaveLength(1);
    expect(taskValuesMock).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundError when snapshot does not exist on create", async () => {
    mockSimpleSelectResult([]);

    await expect(
      service.createFindings("snapshot-missing", "org-1", [] as any, "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("wraps unknown create errors into AppError", async () => {
    selectMock.mockImplementationOnce(() => {
      throw new Error("database exploded");
    });

    await expect(
      service.createFindings("snapshot-1", "org-1", [] as any, "user-1"),
    ).rejects.toMatchObject({
      code: "FINDINGS_CREATE_ERROR",
      statusCode: 500,
    });
  });

  it("returns paginated findings and total count", async () => {
    mockSimpleSelectResult([{ id: "snapshot-1", organizationId: "org-1" }]);
    const paged = mockPagedFindingsResult([
      { id: "finding-1", status: "fail" },
      { id: "finding-2", status: "partial" },
    ]);
    mockSimpleSelectResult([{ count: "7" }]);

    const result = await service.getFindings("snapshot-1", "org-1", {
      page: 2,
      limit: 500,
      status: "invalid-status",
      confidenceLevel: "high",
      framework: "SOC2",
    });

    expect(result.findings).toHaveLength(2);
    expect(result.total).toBe(7);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(100);
    expect(paged.limitMock).toHaveBeenCalledWith(100);
    expect(paged.offsetMock).toHaveBeenCalledWith(100);
  });

  it("gets a finding by id and throws when missing", async () => {
    mockInnerJoinResult([
      {
        repository_findings: {
          id: "finding-1",
          status: "pass",
        },
      },
    ]);

    const found = await service.getFindingById("finding-1", "org-1");
    expect(found.id).toBe("finding-1");

    mockInnerJoinResult([]);
    await expect(service.getFindingById("missing", "org-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reviews a finding and writes audit metadata", async () => {
    vi.spyOn(service, "getFindingById").mockResolvedValue({
      id: "finding-1",
      status: "fail",
    } as any);
    updateReturningQueue.push([
      {
        id: "finding-1",
        status: "pass",
        reviewedBy: "user-2",
      },
    ]);

    const result = await service.reviewFinding("finding-1", "org-1", "user-2", {
      status: "pass",
      humanOverride: {
        originalStatus: "fail",
        newStatus: "pass",
        reason: "Manual evidence verified",
      },
    });

    expect(result).toMatchObject({
      id: "finding-1",
      status: "pass",
      reviewedBy: "user-2",
    });
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pass",
        reviewedBy: "user-2",
        humanOverride: expect.objectContaining({
          originalStatus: "fail",
          newStatus: "pass",
        }),
      }),
    );
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        entityType: "repository_finding",
        metadata: expect.objectContaining({
          originalStatus: "fail",
          newStatus: "pass",
          hadHumanOverride: true,
        }),
      }),
    );
  });

  it("summarizes findings and counts critical issues", async () => {
    mockSimpleSelectResult([{ id: "snapshot-1", organizationId: "org-1" }]);
    mockSimpleSelectResult([
      { status: "fail", framework: "SOC2", confidenceLevel: "high" },
      { status: "fail", framework: "SOC2", confidenceLevel: "medium" },
      { status: "pass", framework: "ISO27001", confidenceLevel: "high" },
    ]);

    const summary = await service.getFindingsSummary("snapshot-1", "org-1");

    expect(summary.total).toBe(3);
    expect(summary.byStatus.fail).toBe(2);
    expect(summary.byStatus.pass).toBe(1);
    expect(summary.byFramework.SOC2).toBe(2);
    expect(summary.byFramework.ISO27001).toBe(1);
    expect(summary.byConfidence.high).toBe(2);
    expect(summary.criticalCount).toBe(1);
  });

  it("deletes all findings for a snapshot", async () => {
    mockSimpleSelectResult([{ id: "snapshot-1", organizationId: "org-1" }]);
    deleteWhereQueue.push({ rowCount: 9 });

    await service.deleteSnapshotFindings("snapshot-1", "org-1", "user-1");

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete",
        entityType: "repository_findings",
      }),
    );
  });

  it("throws NotFoundError when deleting snapshot findings for unknown snapshot", async () => {
    mockSimpleSelectResult([]);

    await expect(
      service.deleteSnapshotFindings("snapshot-missing", "org-1", "user-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rethrows AppError instances without wrapping", async () => {
    selectMock.mockImplementationOnce(() => {
      throw new AppError("already app error", 400, "EXISTING");
    });

    await expect(
      service.getFindings("snapshot-1", "org-1"),
    ).rejects.toMatchObject({ code: "EXISTING" });
  });
});
