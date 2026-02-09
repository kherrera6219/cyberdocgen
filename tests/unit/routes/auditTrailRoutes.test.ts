import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "auditor-1"));
const getAuditLogsMock = vi.hoisted(() => vi.fn());
const logActionMock = vi.hoisted(() => vi.fn());
const getAuditStatsMock = vi.hoisted(() => vi.fn());
const getAuditByIdMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/services/auditService", () => ({
  auditService: {
    getAuditLogs: getAuditLogsMock,
    logAction: logActionMock,
    getAuditStats: getAuditStatsMock,
    getAuditById: getAuditByIdMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerAuditTrailRoutes } from "../../../server/routes/auditTrail";
import { globalErrorHandler } from "../../../server/utils/errorHandling";

describe("auditTrail routes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  let activeOrgId: string | undefined = orgId;

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).organizationId = activeOrgId;
    next();
  });
  const router = express.Router();
  registerAuditTrailRoutes(router);
  app.use("/api/audit-trail", router);
  app.use(globalErrorHandler);

  beforeEach(() => {
    vi.clearAllMocks();
    activeOrgId = orgId;

    getAuditLogsMock.mockResolvedValue({
      logs: [{ id: "log-1", action: "create", entityType: "document" }],
      total: 1,
      page: 1,
      limit: 50,
    });
    logActionMock.mockResolvedValue(undefined);
    getAuditStatsMock.mockResolvedValue({ totalEvents: 42, byAction: { create: 10, update: 20 } });
    getAuditByIdMock.mockResolvedValue({ id: "log-1", action: "create", entityType: "document" });
  });

  it("lists audit logs with filters and writes view audit telemetry", async () => {
    const response = await request(app)
      .get(
        "/api/audit-trail?page=2&limit=10&entityType=document&action=create&search=policy&dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-01-31T23:59:59.999Z",
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBe(1);
    expect(getAuditLogsMock).toHaveBeenCalledWith(
      orgId,
      expect.objectContaining({
        page: 2,
        limit: 10,
        entityType: "document",
        action: "create",
        search: "policy",
      }),
    );

    const queryArg = getAuditLogsMock.mock.calls[0][1];
    expect(queryArg.dateFrom).toBeInstanceOf(Date);
    expect(queryArg.dateTo).toBeInstanceOf(Date);
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "view",
        entityType: "audit_trail",
        organizationId: orgId,
      }),
    );
  });

  it("returns stats and entry detail, handling not found and missing org", async () => {
    const stats = await request(app).get("/api/audit-trail/stats").expect(200);
    expect(stats.body.data.totalEvents).toBe(42);

    const entry = await request(app).get("/api/audit-trail/log-1").expect(200);
    expect(entry.body.data.id).toBe("log-1");
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "audit_log",
        entityId: "log-1",
      }),
    );

    getAuditByIdMock.mockResolvedValueOnce(null);
    const missing = await request(app).get("/api/audit-trail/missing-log").expect(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    activeOrgId = undefined;
    const noOrg = await request(app).get("/api/audit-trail/stats").expect(403);
    expect(noOrg.body.error.code).toBe("ORG_CONTEXT_REQUIRED");
  });
});

