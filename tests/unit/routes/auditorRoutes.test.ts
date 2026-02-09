import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectResults = vi.hoisted(() => [] as any[]);
const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "auditor-1"));

function createSelectChain() {
  const chain: any = {
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(selectResults.shift() ?? []).then(resolve, reject),
  };
  return chain;
}

const selectMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn(() => createSelectChain()) })));

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/db", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerAuditorRoutes } from "../../../server/routes/auditor";
import { globalErrorHandler } from "../../../server/utils/errorHandling";

describe("auditor routes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  let activeOrgId: string | undefined = orgId;

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).organizationId = activeOrgId;
    next();
  });
  registerAuditorRoutes(app);
  app.use(globalErrorHandler);

  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    activeOrgId = orgId;
  });

  it("returns workspace documents with pagination metadata", async () => {
    selectResults.push(
      [{ documents: { id: "doc-1", status: "approved", framework: "SOC2" } }],
      [{ total: 2 }],
    );

    const response = await request(app)
      .get("/api/auditor/documents?status=approved&framework=SOC2&limit=1&offset=0")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.documents).toHaveLength(1);
    expect(response.body.data.documents[0].id).toBe("doc-1");
    expect(response.body.data.pagination.total).toBe(2);
    expect(response.body.data.pagination.hasMore).toBe(true);
  });

  it("returns compliance overview aggregates", async () => {
    selectResults.push(
      [
        { status: "approved", count: 3 },
        { status: "draft", count: 1 },
      ],
      [{ status: "approved", count: 2 }],
      [{ gapReportsCount: 5 }],
      [
        { framework: "SOC2", count: 2 },
        { framework: "ISO27001", count: 2 },
      ],
    );

    const response = await request(app).get("/api/auditor/overview").expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.compliancePercentage).toBe(75);
    expect(response.body.data.totalDocuments).toBe(4);
    expect(response.body.data.gapAnalysisReports).toBe(5);
    expect(response.body.data.documentsByFramework).toHaveLength(2);
  });

  it("exports reports in JSON and alternate formats", async () => {
    selectResults.push(
      [
        { documents: { id: "doc-1", status: "approved" } },
        { documents: { id: "doc-2", status: "draft" } },
      ],
      [{ document_approvals: { id: "approval-1", status: "approved" } }],
    );
    const jsonExport = await request(app).get("/api/auditor/export?format=json").expect(200);
    expect(jsonExport.body.data.summary.totalDocuments).toBe(2);
    expect(jsonExport.body.data.summary.totalApprovals).toBe(1);
    expect(jsonExport.body.data.framework).toBe("All");

    selectResults.push(
      [{ documents: { id: "doc-3", status: "approved" } }],
      [{ document_approvals: { id: "approval-2", status: "pending" } }],
    );
    const csvExport = await request(app).get("/api/auditor/export?format=csv&framework=SOC2").expect(200);
    expect(csvExport.body.data.message).toMatch(/not yet implemented/i);
    expect(csvExport.body.data.framework).toBe("SOC2");
  });

  it("requires organization context", async () => {
    activeOrgId = undefined;
    const response = await request(app).get("/api/auditor/overview").expect(403);
    expect(response.body.error.code).toBe("ORG_CONTEXT_REQUIRED");
  });
});

