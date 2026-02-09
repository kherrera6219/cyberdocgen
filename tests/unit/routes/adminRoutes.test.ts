import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserIdMock = vi.hoisted(() => vi.fn(() => "admin-1"));
const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "admin-1"));
const usersFindFirstMock = vi.hoisted(() => vi.fn());
const usersFindManyMock = vi.hoisted(() => vi.fn());
const cloudIntegrationsFindManyMock = vi.hoisted(() => vi.fn());
const cloudIntegrationsFindFirstMock = vi.hoisted(() => vi.fn());
const auditLogsFindManyMock = vi.hoisted(() => vi.fn());
const dbDeleteWhereMock = vi.hoisted(() => vi.fn());
const dbDeleteMock = vi.hoisted(() => vi.fn(() => ({ where: dbDeleteWhereMock })));
const dbSelectFromMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn(() => ({ from: dbSelectFromMock })));

const getOAuthSettingsForUIMock = vi.hoisted(() => vi.fn());
const setOAuthCredentialsMock = vi.hoisted(() => vi.fn());
const getPDFDefaultsMock = vi.hoisted(() => vi.fn());
const setPDFDefaultsMock = vi.hoisted(() => vi.fn());
const logAuditEventMock = vi.hoisted(() => vi.fn());

const getPerformanceMetricsMock = vi.hoisted(() => vi.fn());
const getAlertMetricsMock = vi.hoisted(() => vi.fn());
const getSecurityMetricsMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
  getUserId: getUserIdMock,
}));

vi.mock("../../../server/db", () => ({
  db: {
    query: {
      users: {
        findFirst: usersFindFirstMock,
        findMany: usersFindManyMock,
      },
      cloudIntegrations: {
        findMany: cloudIntegrationsFindManyMock,
        findFirst: cloudIntegrationsFindFirstMock,
      },
      auditLogs: {
        findMany: auditLogsFindManyMock,
      },
    },
    delete: dbDeleteMock,
    select: dbSelectMock,
  },
}));

vi.mock("../../../server/services/systemConfigService", () => ({
  systemConfigService: {
    getOAuthSettingsForUI: getOAuthSettingsForUIMock,
    setOAuthCredentials: setOAuthCredentialsMock,
    getPDFDefaults: getPDFDefaultsMock,
    setPDFDefaults: setPDFDefaultsMock,
  },
}));

vi.mock("../../../server/services/auditService", () => ({
  auditService: {
    logAuditEvent: logAuditEventMock,
  },
  AuditAction: {
    DELETE: "delete",
  },
  RiskLevel: {
    HIGH: "high",
  },
}));

vi.mock("../../../server/services/performanceService", () => ({
  performanceService: {
    getMetrics: getPerformanceMetricsMock,
  },
}));

vi.mock("../../../server/services/alertingService", () => ({
  alertingService: {
    getAlertMetrics: getAlertMetricsMock,
  },
}));

vi.mock("../../../server/services/threatDetectionService", () => ({
  threatDetectionService: {
    getSecurityMetrics: getSecurityMetricsMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import adminRouter from "../../../server/routes/admin";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRouter);
  return app;
}

describe("admin routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();

    usersFindFirstMock.mockResolvedValue({ id: "admin-1", role: "admin", isActive: true });
    usersFindManyMock.mockResolvedValue([
      { id: "admin-1", role: "admin", isActive: true, twoFactorEnabled: true },
      { id: "user-2", role: "user", isActive: true, twoFactorEnabled: false },
    ]);
    cloudIntegrationsFindManyMock.mockResolvedValue([
      {
        id: "integration-1",
        provider: "google_drive",
        displayName: "Google Drive",
        email: "team@example.com",
        isActive: true,
        syncStatus: "active",
        createdAt: "2025-01-01T00:00:00.000Z",
        userId: "user-2",
        user: {
          id: "user-2",
          email: "user-2@example.com",
          firstName: "User",
          lastName: "Two",
        },
      },
    ]);
    cloudIntegrationsFindFirstMock.mockResolvedValue({
      id: "integration-1",
      provider: "google_drive",
      userId: "user-2",
    });
    auditLogsFindManyMock.mockResolvedValue([{ id: "audit-1" }]);

    dbSelectFromMock.mockResolvedValue([
      { fileType: "pdf", isSecurityLocked: true },
      { fileType: "docx", isSecurityLocked: false },
      { fileType: "xlsx", isSecurityLocked: true },
    ]);
    dbDeleteWhereMock.mockResolvedValue(undefined);

    getOAuthSettingsForUIMock.mockResolvedValue({ googleConfigured: true, microsoftConfigured: false });
    setOAuthCredentialsMock.mockResolvedValue(true);
    getPDFDefaultsMock.mockResolvedValue({
      defaultEncryptionLevel: "AES256",
      defaultAllowPrinting: false,
      defaultAllowCopying: false,
      defaultAllowModifying: false,
      defaultAllowAnnotations: false,
      defaultWatermarkText: "CONFIDENTIAL",
      defaultWatermarkOpacity: 0.3,
    });
    setPDFDefaultsMock.mockResolvedValue(true);

    getPerformanceMetricsMock.mockResolvedValue({ avgLatencyMs: 12 });
    getAlertMetricsMock.mockResolvedValue({ openAlerts: 1 });
    getSecurityMetricsMock.mockResolvedValue({ threatCount: 0 });
  });

  it("returns unauthorized/forbidden for non-admin access", async () => {
    getUserIdMock.mockReturnValueOnce(undefined);
    const unauthorized = await request(app).get("/api/admin/oauth-settings").expect(401);
    expect(unauthorized.body.success).toBe(false);

    getUserIdMock.mockReturnValue("user-1");
    usersFindFirstMock.mockResolvedValueOnce({ id: "user-1", role: "user", isActive: true });
    const forbidden = await request(app).get("/api/admin/oauth-settings").expect(403);
    expect(forbidden.body.success).toBe(false);
  });

  it("handles oauth and pdf settings endpoints", async () => {
    const oauthGet = await request(app).get("/api/admin/oauth-settings").expect(200);
    expect(oauthGet.body.data.googleConfigured).toBe(true);

    const oauthPost = await request(app)
      .post("/api/admin/oauth-settings")
      .send({
        googleClientId: "google-id",
        googleClientSecret: "google-secret",
        microsoftClientId: "ms-id",
        microsoftClientSecret: "ms-secret",
      })
      .expect(200);
    expect(oauthPost.body.success).toBe(true);
    expect(setOAuthCredentialsMock).toHaveBeenCalledTimes(2);

    const oauthInvalid = await request(app).post("/api/admin/oauth-settings").send({}).expect(400);
    expect(oauthInvalid.body.error.code).toBe("VALIDATION_ERROR");

    const pdfGet = await request(app).get("/api/admin/pdf-defaults").expect(200);
    expect(pdfGet.body.data.defaultEncryptionLevel).toBe("AES256");

    await request(app)
      .post("/api/admin/pdf-defaults")
      .send({
        defaultEncryptionLevel: "AES256",
        defaultAllowPrinting: false,
        defaultAllowCopying: false,
        defaultAllowModifying: false,
        defaultAllowAnnotations: false,
        defaultWatermarkText: "CONFIDENTIAL",
        defaultWatermarkOpacity: 0.3,
      })
      .expect(200);

    setPDFDefaultsMock.mockResolvedValueOnce(false);
    const pdfFail = await request(app)
      .post("/api/admin/pdf-defaults")
      .send({
        defaultEncryptionLevel: "AES256",
        defaultAllowPrinting: false,
        defaultAllowCopying: false,
        defaultAllowModifying: false,
        defaultAllowAnnotations: false,
        defaultWatermarkText: "CONFIDENTIAL",
        defaultWatermarkOpacity: 0.3,
      })
      .expect(400);
    expect(pdfFail.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("handles cloud integration, monitoring, and stats endpoints", async () => {
    const integrations = await request(app).get("/api/admin/cloud-integrations").expect(200);
    expect(integrations.body.data).toHaveLength(1);
    expect(integrations.body.data[0].provider).toBe("google_drive");
    expect(integrations.body.data[0].user.email).toBe("user-2@example.com");

    await request(app).delete("/api/admin/cloud-integrations/integration-1").expect(200);
    expect(dbDeleteMock).toHaveBeenCalled();
    expect(logAuditEventMock).toHaveBeenCalled();

    cloudIntegrationsFindFirstMock.mockResolvedValueOnce(null);
    const notFound = await request(app)
      .delete("/api/admin/cloud-integrations/missing-integration")
      .expect(404);
    expect(notFound.body.error.code).toBe("NOT_FOUND");

    const monitoring = await request(app).get("/api/admin/monitoring").expect(200);
    expect(monitoring.body.data.performance.avgLatencyMs).toBe(12);
    expect(monitoring.body.data.alerts.openAlerts).toBe(1);
    expect(monitoring.body.data.security.threatCount).toBe(0);

    const stats = await request(app).get("/api/admin/stats").expect(200);
    expect(stats.body.data.users.total).toBe(2);
    expect(stats.body.data.users.admins).toBe(1);
    expect(stats.body.data.integrations.google).toBe(1);
    expect(stats.body.data.files.total).toBe(3);
    expect(stats.body.data.security.recentAudits).toBe(1);
  });
});
