import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisContext } from "../../server/services/repoAnalysisService";
import { AppError } from "../../server/utils/errorHandling";

const dbMocks = vi.hoisted(() => {
  const whereResults: any[] = [];
  const limitResults: any[] = [];

  const whereMock = vi.fn(() => Promise.resolve(whereResults.shift() ?? []));
  const limitMock = vi.fn(() => Promise.resolve(limitResults.shift() ?? []));
  const orderByMock = vi.fn(() => ({ limit: limitMock }));
  const innerJoinMock = vi.fn(() => ({ where: whereMock }));
  const fromMock = vi.fn(() => ({ where: whereMock, orderBy: orderByMock, innerJoin: innerJoinMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));

  const insertReturningMock = vi.fn();
  const insertValuesMock = vi.fn(() => ({ returning: insertReturningMock }));
  const insertMock = vi.fn(() => ({ values: insertValuesMock }));

  const updateWhereMock = vi.fn(() => Promise.resolve(undefined));
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));

  return {
    whereResults,
    limitResults,
    whereMock,
    limitMock,
    orderByMock,
    innerJoinMock,
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

const logActionMock = vi.hoisted(() => vi.fn());
const scanForCICDMock = vi.hoisted(() => vi.fn());
const scanForSecretsMock = vi.hoisted(() => vi.fn());
const scanForAuthPatternsMock = vi.hoisted(() => vi.fn());
const scanForAccessControlMock = vi.hoisted(() => vi.fn());
const scanForEncryptionMock = vi.hoisted(() => vi.fn());
const scanForLoggingMock = vi.hoisted(() => vi.fn());
const mapSignalsToControlsMock = vi.hoisted(() => vi.fn());
const createFindingsMock = vi.hoisted(() => vi.fn());

vi.mock("../../server/db", () => ({
  db: {
    select: dbMocks.selectMock,
    insert: dbMocks.insertMock,
    update: dbMocks.updateMock,
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logAction: logActionMock,
  },
}));

vi.mock("../../server/services/repoParserService", () => ({
  repoParserService: {},
}));

vi.mock("../../server/services/codeSignalDetectorService", () => ({
  codeSignalDetectorService: {
    scanForCICD: scanForCICDMock,
    scanForSecrets: scanForSecretsMock,
    scanForAuthPatterns: scanForAuthPatternsMock,
    scanForAccessControl: scanForAccessControlMock,
    scanForEncryption: scanForEncryptionMock,
    scanForLogging: scanForLoggingMock,
  },
}));

vi.mock("../../server/services/controlMappingService", () => ({
  controlMappingService: {
    mapSignalsToControls: mapSignalsToControlsMock,
  },
}));

vi.mock("../../server/services/repositoryFindingsService", () => ({
  repositoryFindingsService: {
    createFindings: createFindingsMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { repoAnalysisService } from "../../server/services/repoAnalysisService";

function createContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    snapshotId: "snapshot-1",
    runId: "run-1",
    extractedPath: "C:/repos/snapshot-1",
    frameworks: ["SOC2"],
    depth: "security_relevant",
    organizationId: "org-1",
    userId: "user-1",
    signals: {
      auth: [],
      encryption: [],
      logging: [],
      accessControl: [],
      cicd: [],
      secretsWarnings: [],
      scannedFiles: 0,
      skippedFiles: 0,
    },
    metrics: {
      filesAnalyzed: 0,
      findingsGenerated: 0,
      llmCallsMade: 0,
      tokensUsed: 0,
      costEstimate: 0,
    },
    ...overrides,
  };
}

describe("repoAnalysisService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.whereResults.length = 0;
    dbMocks.limitResults.length = 0;

    logActionMock.mockResolvedValue(undefined);
    scanForCICDMock.mockResolvedValue([]);
    scanForSecretsMock.mockResolvedValue([]);
    scanForAuthPatternsMock.mockResolvedValue([]);
    scanForAccessControlMock.mockResolvedValue([]);
    scanForEncryptionMock.mockResolvedValue([]);
    scanForLoggingMock.mockResolvedValue([]);
    mapSignalsToControlsMock.mockResolvedValue([]);
    createFindingsMock.mockResolvedValue([]);
  });

  it("starts analysis for indexed snapshots", async () => {
    dbMocks.whereResults.push(
      [{ id: "snapshot-1", status: "indexed", organizationId: "org-1", extractedPath: "C:/repos/snapshot-1" }],
      [],
    );
    dbMocks.insertReturningMock.mockResolvedValueOnce([
      { id: "run-1", snapshotId: "snapshot-1", frameworks: ["SOC2"], analysisDepth: "security_relevant" },
    ]);

    const executeSpy = vi.spyOn(repoAnalysisService as any, "executeAnalysis").mockResolvedValue(undefined);

    const result = await repoAnalysisService.startAnalysis(
      "snapshot-1",
      ["SOC2"],
      "security_relevant",
      "org-1",
      "user-1",
    );

    expect(result).toEqual({ runId: "run-1" });
    expect(dbMocks.insertMock).toHaveBeenCalledTimes(1);
    expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "analyzing",
      }),
    );
    expect(logActionMock).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith("run-1", "C:/repos/snapshot-1", "org-1", "user-1");
    executeSpy.mockRestore();
  });

  it("rejects startAnalysis when snapshot is missing, not indexed, or already running", async () => {
    dbMocks.whereResults.push([]);
    await expect(
      repoAnalysisService.startAnalysis("missing", ["SOC2"], "security_relevant", "org-1", "user-1"),
    ).rejects.toThrow(/snapshot not found/i);

    dbMocks.whereResults.push([{ id: "snapshot-1", status: "extracting", organizationId: "org-1" }]);
    await expect(
      repoAnalysisService.startAnalysis("snapshot-1", ["SOC2"], "security_relevant", "org-1", "user-1"),
    ).rejects.toThrow(/must be indexed/i);

    dbMocks.whereResults.push(
      [{ id: "snapshot-1", status: "indexed", organizationId: "org-1", extractedPath: "C:/repos/snapshot-1" }],
      [{ id: "existing-run", snapshotId: "snapshot-1" }],
    );
    await expect(
      repoAnalysisService.startAnalysis("snapshot-1", ["SOC2"], "security_relevant", "org-1", "user-1"),
    ).rejects.toThrow(/already running/i);
  });

  it("executes phase helpers and updates context metrics", async () => {
    const context = createContext({ frameworks: ["SOC2", "ISO27001"] });

    dbMocks.whereResults.push([{ fileName: "README.md" }, { fileName: "SECURITY.md" }]);
    await (repoAnalysisService as any).executeOverviewPhase(context);
    expect(context.metrics.filesAnalyzed).toBe(2);

    scanForCICDMock.mockResolvedValueOnce([
      {
        type: "github_actions",
        hasSecurityScanning: true,
        hasSecretScanning: true,
        hasDependencyScanning: false,
        confidence: "high",
        files: [{ path: ".github/workflows/ci.yml", evidence: "npm audit" }],
        details: "workflow",
      },
    ]);
    await (repoAnalysisService as any).executeBuildPhase(context);
    expect(context.signals.cicd).toHaveLength(1);

    scanForSecretsMock.mockResolvedValueOnce([
      {
        type: "api_key",
        severity: "high",
        files: [{ path: ".env", evidence: "API_KEY=***" }],
        recommendation: "move to secret manager",
      },
    ]);
    await (repoAnalysisService as any).executeConfigPhase(context);
    expect(context.signals.secretsWarnings).toHaveLength(1);

    scanForAuthPatternsMock.mockResolvedValueOnce([
      {
        type: "jwt",
        confidence: "high",
        details: "jwt sign/verify",
        files: [{ path: "auth.ts", evidence: "jwt.sign" }],
      },
    ]);
    scanForAccessControlMock.mockResolvedValueOnce([
      {
        type: "rbac",
        confidence: "medium",
        details: "role checks",
        files: [{ path: "roles.ts", evidence: "requirePermission" }],
      },
    ]);
    await (repoAnalysisService as any).executeAuthPhase(context);
    expect(context.signals.auth).toHaveLength(1);
    expect(context.signals.accessControl).toHaveLength(1);

    scanForEncryptionMock.mockResolvedValueOnce([
      {
        type: "at_rest",
        confidence: "high",
        details: "AES",
        files: [{ path: "crypto.ts", evidence: "encrypt" }],
      },
    ]);
    await (repoAnalysisService as any).executeDataPhase(context);
    expect(context.signals.encryption).toHaveLength(1);

    scanForLoggingMock.mockResolvedValueOnce([
      {
        type: "audit",
        confidence: "high",
        details: "audit logs",
        files: [{ path: "audit.ts", evidence: "logAudit" }],
      },
    ]);
    await (repoAnalysisService as any).executeOperationsPhase(context);
    expect(context.signals.logging).toHaveLength(1);

    mapSignalsToControlsMock
      .mockResolvedValueOnce([{ controlId: "CC6.1" }])
      .mockResolvedValueOnce([{ controlId: "A.9.2.1" }]);
    createFindingsMock.mockResolvedValueOnce([{ id: "f-1" }, { id: "f-2" }]).mockResolvedValueOnce([
      { id: "f-3" },
    ]);

    await (repoAnalysisService as any).executeGapPhase(context);
    expect(mapSignalsToControlsMock).toHaveBeenCalledTimes(2);
    expect(createFindingsMock).toHaveBeenCalledTimes(2);
    expect(context.metrics.findingsGenerated).toBe(3);
  });

  it("completes and fails runs with expected updates", async () => {
    const context = createContext({
      metrics: {
        filesAnalyzed: 12,
        findingsGenerated: 4,
        llmCallsMade: 7,
        tokensUsed: 1500,
        costEstimate: 1.25,
      },
    });

    await (repoAnalysisService as any).completeAnalysis("run-1", context);
    expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phaseStatus: "completed",
        progress: 100,
        findingsGenerated: 4,
      }),
    );

    dbMocks.whereResults.push([{ id: "run-2", snapshotId: "snapshot-1" }]);
    await (repoAnalysisService as any).failAnalysis("run-2", "phase crash");
    expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phaseStatus: "failed",
      }),
    );
    expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorMessage: "phase crash",
      }),
    );
  });

  it("returns analysis status and reports not-found with wrapped error handling", async () => {
    dbMocks.whereResults.push([
      {
        repository_analysis_runs: {
          id: "run-1",
          snapshotId: "snapshot-1",
          phaseStatus: "running",
        },
      },
    ]);

    const status = await repoAnalysisService.getAnalysisStatus("run-1", "org-1");
    expect(status.id).toBe("run-1");
    expect(status.phaseStatus).toBe("running");

    dbMocks.whereResults.push([]);
    await expect(repoAnalysisService.getAnalysisStatus("missing", "org-1")).rejects.toBeInstanceOf(AppError);
    await expect(repoAnalysisService.getAnalysisStatus("missing", "org-1")).rejects.toThrow(
      /run not found|status/i,
    );
  });

  it("handles executeAnalysis failure path and marks run failed", async () => {
    dbMocks.whereResults.push(
      [{ id: "run-1", snapshotId: "snapshot-1", frameworks: ["SOC2"], analysisDepth: "security_relevant" }],
      [{ id: "snapshot-doc-1", fileName: "README.md" }],
      [{ id: "run-1", snapshotId: "snapshot-1" }],
    );

    const phases = (repoAnalysisService as any).phases as Array<{ execute: (...args: any[]) => Promise<void> }>;
    const originalExecute = phases[1].execute;
    const buildPhaseMock = vi.fn().mockRejectedValueOnce(new Error("phase build failed"));
    phases[1].execute = buildPhaseMock;

    await (repoAnalysisService as any).executeAnalysis("run-1", "C:/repos/snapshot-1", "org-1", "user-1");
    expect(buildPhaseMock).toHaveBeenCalledTimes(1);
    expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phaseStatus: "failed",
      }),
    );
    phases[1].execute = originalExecute;
  });
});
