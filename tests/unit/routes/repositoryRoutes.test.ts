import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));

const selectResults = vi.hoisted(() => [] as any[]);
const limitResults = vi.hoisted(() => [] as any[]);
const updateReturningResults = vi.hoisted(() => [] as any[]);

function createSelectChain() {
  const chain: any = {
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(limitResults.shift() ?? [])),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(selectResults.shift() ?? []).then(resolve, reject),
  };
  return chain;
}

const selectMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn(() => createSelectChain()) })));
const updateReturningMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(updateReturningResults.shift() ?? [])),
);
const updateWhereMock = vi.hoisted(() => vi.fn(() => ({ returning: updateReturningMock })));
const updateSetMock = vi.hoisted(() => vi.fn(() => ({ where: updateWhereMock })));
const updateMock = vi.hoisted(() => vi.fn(() => ({ set: updateSetMock })));
const deleteWhereMock = vi.hoisted(() => vi.fn(() => Promise.resolve(undefined)));
const deleteMock = vi.hoisted(() => vi.fn(() => ({ where: deleteWhereMock })));

const uploadAndExtractMock = vi.hoisted(() => vi.fn());
const generateManifestMock = vi.hoisted(() => vi.fn());
const detectTechnologiesMock = vi.hoisted(() => vi.fn());
const indexFilesMock = vi.hoisted(() => vi.fn());
const startAnalysisMock = vi.hoisted(() => vi.fn());
const getFindingsMock = vi.hoisted(() => vi.fn());
const getFindingsSummaryMock = vi.hoisted(() => vi.fn());
const reviewFindingMock = vi.hoisted(() => vi.fn());
const deleteSnapshotFindingsMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  getUserId: getUserIdMock,
}));

vi.mock("../../../server/db", () => ({
  db: {
    select: selectMock,
    update: updateMock,
    delete: deleteMock,
  },
}));

vi.mock("../../../server/services/repoParserService", () => ({
  repoParserService: {
    uploadAndExtract: uploadAndExtractMock,
    generateManifest: generateManifestMock,
    detectTechnologies: detectTechnologiesMock,
    indexFiles: indexFilesMock,
  },
}));

vi.mock("../../../server/services/repoAnalysisService", () => ({
  repoAnalysisService: {
    startAnalysis: startAnalysisMock,
  },
}));

vi.mock("../../../server/services/repositoryFindingsService", () => ({
  repositoryFindingsService: {
    getFindings: getFindingsMock,
    getFindingsSummary: getFindingsSummaryMock,
    reviewFinding: reviewFindingMock,
    deleteSnapshotFindings: deleteSnapshotFindingsMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import repositoryRouter from "../../../server/routes/repository";

describe("repository routes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const otherOrgId = "22222222-2222-4222-8222-222222222222";
  const profileId = "33333333-3333-4333-8333-333333333333";
  const snapshotId = "44444444-4444-4444-8444-444444444444";
  const findingId = "55555555-5555-4555-8555-555555555555";
  const taskId = "66666666-6666-4666-8666-666666666666";

  let activeOrgId: string | undefined = orgId;
  const app = express();

  app.use(express.json({ limit: "4mb" }));
  app.use((req, _res, next) => {
    (req as any).organizationId = activeOrgId;
    next();
  });
  app.use("/api/repository", repositoryRouter);

  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    limitResults.length = 0;
    updateReturningResults.length = 0;
    activeOrgId = orgId;

    uploadAndExtractMock.mockResolvedValue({
      snapshotId,
      extractedPath: "C:/repos/snapshot",
      fileCount: 5,
    });
    generateManifestMock.mockResolvedValue({
      files: [{ relativePath: "README.md" }],
      manifestHash: "manifest-hash-1",
    });
    detectTechnologiesMock.mockResolvedValue(undefined);
    indexFilesMock.mockResolvedValue(undefined);
    startAnalysisMock.mockResolvedValue({ runId: "run-1" });
    getFindingsMock.mockResolvedValue({ findings: [{ id: findingId }], total: 1 });
    getFindingsSummaryMock.mockResolvedValue({ pass: 1, fail: 0 });
    reviewFindingMock.mockResolvedValue({ id: findingId, status: "pass" });
    deleteSnapshotFindingsMock.mockResolvedValue(undefined);
  });

  it("uploads repository zips and blocks cross-organization uploads", async () => {
    const uploadOk = await request(app)
      .post("/api/repository/upload")
      .field("organizationId", orgId)
      .field("companyProfileId", profileId)
      .field("name", "Repo Snapshot")
      .attach("file", Buffer.from("zip"), "repo.zip")
      .expect(201);

    expect(uploadOk.body.success).toBe(true);
    expect(uploadOk.body.data.snapshotId).toBe(snapshotId);
    expect(uploadAndExtractMock).toHaveBeenCalledWith(
      expect.any(Buffer),
      "repo.zip",
      orgId,
      profileId,
      "user-1",
      "Repo Snapshot",
    );
    expect(generateManifestMock).toHaveBeenCalled();
    expect(detectTechnologiesMock).toHaveBeenCalled();
    expect(indexFilesMock).toHaveBeenCalled();

    const crossTenant = await request(app)
      .post("/api/repository/upload")
      .field("organizationId", otherOrgId)
      .field("companyProfileId", profileId)
      .field("name", "Cross Tenant")
      .attach("file", Buffer.from("zip"), "repo.zip")
      .expect(403);

    expect(crossTenant.body.success).toBe(false);
  });

  it("lists snapshots and gets snapshot details", async () => {
    limitResults.push([{ id: snapshotId, name: "Repo 1", status: "indexed" }]);
    const list = await request(app).get("/api/repository").expect(200);
    expect(list.body.data.snapshots).toHaveLength(1);

    selectResults.push([{ id: snapshotId, organizationId: orgId, name: "Repo 1", status: "indexed" }]);
    const detail = await request(app).get(`/api/repository/${snapshotId}`).expect(200);
    expect(detail.body.data.snapshot.id).toBe(snapshotId);

    selectResults.push([]);
    const missing = await request(app).get(`/api/repository/${snapshotId}`).expect(404);
    expect(missing.body.success).toBe(false);
  });

  it("starts analysis and returns run status", async () => {
    selectResults.push([{ id: snapshotId, organizationId: orgId, status: "indexed" }]);
    const start = await request(app)
      .post(`/api/repository/${snapshotId}/analyze`)
      .send({ frameworks: ["SOC2"], depth: "security_relevant" })
      .expect(202);

    expect(start.body.data.runId).toBe("run-1");
    expect(startAnalysisMock).toHaveBeenCalledWith(snapshotId, ["SOC2"], "security_relevant", orgId, "user-1");

    selectResults.push([{ id: snapshotId, organizationId: orgId, status: "analyzing", analysisPhase: "Build & CI/CD" }]);
    limitResults.push([
      { id: "run-1", snapshotId, phaseStatus: "running", phase: "Build & CI/CD", progress: 35 },
    ]);
    const status = await request(app).get(`/api/repository/${snapshotId}/analysis`).expect(200);

    expect(status.body.data.analysisRun.id).toBe("run-1");
    expect(status.body.data.snapshot.status).toBe("analyzing");
  });

  it("lists findings, reviews findings, lists tasks, and updates tasks", async () => {
    selectResults.push([{ id: snapshotId, organizationId: orgId }]);
    const findings = await request(app)
      .get(`/api/repository/${snapshotId}/findings?framework=SOC2&status=fail&page=1&limit=10`)
      .expect(200);
    expect(findings.body.data.findings).toHaveLength(1);
    expect(getFindingsMock).toHaveBeenCalledWith(
      snapshotId,
      orgId,
      expect.objectContaining({
        framework: "SOC2",
        status: "fail",
        page: 1,
        limit: 10,
      }),
    );

    selectResults.push([{ id: snapshotId, organizationId: orgId }]);
    const review = await request(app)
      .patch(`/api/repository/${snapshotId}/findings/${findingId}`)
      .send({ status: "pass" })
      .expect(200);
    expect(review.body.data.finding.status).toBe("pass");
    expect(reviewFindingMock).toHaveBeenCalledWith(findingId, orgId, "user-1", { status: "pass" });

    selectResults.push(
      [{ id: snapshotId, organizationId: orgId }],
      [{ id: taskId, snapshotId, status: "open" }],
    );
    const tasks = await request(app).get(`/api/repository/${snapshotId}/tasks`).expect(200);
    expect(tasks.body.data.tasks[0].id).toBe(taskId);

    selectResults.push([{ id: snapshotId, organizationId: orgId }]);
    updateReturningResults.push([{ id: taskId, snapshotId, status: "completed", completedBy: "user-1" }]);
    const updatedTask = await request(app)
      .patch(`/api/repository/${snapshotId}/tasks/${taskId}`)
      .send({ status: "completed" })
      .expect(200);
    expect(updatedTask.body.data.task.status).toBe("completed");
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        completedBy: "user-1",
      }),
    );
  });

  it("deletes snapshots and enforces organization context requirement", async () => {
    selectResults.push([{ id: snapshotId, organizationId: orgId }]);
    const deleted = await request(app).delete(`/api/repository/${snapshotId}`).expect(200);
    expect(deleted.body.data.message).toMatch(/deleted/i);
    expect(deleteSnapshotFindingsMock).toHaveBeenCalledWith(snapshotId, orgId, "user-1");
    expect(deleteMock).toHaveBeenCalledTimes(1);

    activeOrgId = undefined;
    const missingOrgContext = await request(app).get("/api/repository").expect(403);
    expect(missingOrgContext.body.success).toBe(false);
  });
});
