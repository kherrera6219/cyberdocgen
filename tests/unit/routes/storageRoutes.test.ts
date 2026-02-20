import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));
const requireOrganizationMock = vi.hoisted(() => vi.fn((req: any, _res: any, next: any) => {
  req.organizationId = "org-1";
  next();
}));
const getDocumentWithOrgCheckMock = vi.hoisted(() => vi.fn());
const getCompanyProfileWithOrgCheckMock = vi.hoisted(() => vi.fn());

const uploadDocumentMock = vi.hoisted(() => vi.fn());
const downloadDocumentMock = vi.hoisted(() => vi.fn());
const uploadCompanyProfileMock = vi.hoisted(() => vi.fn());
const downloadCompanyProfileMock = vi.hoisted(() => vi.fn());
const uploadFileFromBytesMock = vi.hoisted(() => vi.fn());
const downloadFileAsBytesMock = vi.hoisted(() => vi.fn());
const listObjectsMock = vi.hoisted(() => vi.fn());
const listObjectsInFolderMock = vi.hoisted(() => vi.fn());
const deleteObjectMock = vi.hoisted(() => vi.fn());
const getStorageStatsMock = vi.hoisted(() => vi.fn());
const uploadBackupMock = vi.hoisted(() => vi.fn());
const downloadBackupMock = vi.hoisted(() => vi.fn());
const uploadAuditLogsMock = vi.hoisted(() => vi.fn());
const logAuditMock = vi.hoisted(() => vi.fn());
const incrementCounterMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getUserId: getUserIdMock,
}));

vi.mock("../../../server/middleware/multiTenant", () => ({
  requireOrganization: requireOrganizationMock,
  getDocumentWithOrgCheck: getDocumentWithOrgCheckMock,
  getCompanyProfileWithOrgCheck: getCompanyProfileWithOrgCheckMock,
}));

vi.mock("../../../server/services/objectStorageService", () => ({
  objectStorageService: {
    uploadDocument: uploadDocumentMock,
    downloadDocument: downloadDocumentMock,
    uploadCompanyProfile: uploadCompanyProfileMock,
    downloadCompanyProfile: downloadCompanyProfileMock,
    uploadFileFromBytes: uploadFileFromBytesMock,
    downloadFileAsBytes: downloadFileAsBytesMock,
    listObjects: listObjectsMock,
    listObjectsInFolder: listObjectsInFolderMock,
    deleteObject: deleteObjectMock,
    getStorageStats: getStorageStatsMock,
    uploadBackup: uploadBackupMock,
    downloadBackup: downloadBackupMock,
    uploadAuditLogs: uploadAuditLogsMock,
  },
}));

vi.mock("../../../server/services/auditService", () => ({
  auditService: {
    logAudit: logAuditMock,
  },
  AuditAction: {
    CREATE: "create",
    READ: "read",
    DELETE: "delete",
    DATA_EXPORT: "data_export",
  },
}));

vi.mock("../../../server/monitoring/metrics", () => ({
  metricsCollector: {
    incrementCounter: incrementCounterMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerStorageRoutes } from "../../../server/routes/storage";

function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  const router = express.Router();
  registerStorageRoutes(router);
  app.use("/api/storage", router);
  return app;
}

describe("storage routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();

    getDocumentWithOrgCheckMock.mockResolvedValue({ authorized: true, document: { id: "doc-1" } });
    getCompanyProfileWithOrgCheckMock.mockResolvedValue({ authorized: true, profile: { id: "profile-1" } });

    uploadDocumentMock.mockResolvedValue({ success: true, path: "organizations/org-1/documents/doc-1.json" });
    downloadDocumentMock.mockResolvedValue({ success: true, data: { id: "doc-1" } });
    uploadCompanyProfileMock.mockResolvedValue({ success: true, path: "organizations/org-1/profiles/profile-1.json" });
    downloadCompanyProfileMock.mockResolvedValue({ success: true, data: { id: "profile-1" } });
    uploadFileFromBytesMock.mockResolvedValue({ success: true, path: "organizations/org-1/reports/report.pdf" });
    downloadFileAsBytesMock.mockResolvedValue({ success: true, data: Buffer.from("pdf-bytes") });
    listObjectsMock.mockResolvedValue({ success: true, files: ["a.txt", "b.txt"] });
    listObjectsInFolderMock.mockResolvedValue({ success: true, files: ["organizations/org-1/reports/c.txt"] });
    deleteObjectMock.mockResolvedValue({ success: true });
    getStorageStatsMock.mockResolvedValue({ success: true, data: { totalFiles: 3, totalSize: 1024 } });
    uploadBackupMock.mockResolvedValue({ success: true, path: "organizations/org-1/backups/backup-1.json" });
    downloadBackupMock.mockResolvedValue({ success: true, data: { backupId: "backup-1" } });
    uploadAuditLogsMock.mockResolvedValue({ success: true, path: "organizations/org-1/audit-logs/log-1.json" });
    logAuditMock.mockResolvedValue(undefined);
  });

  it("handles document/profile/file upload and download operations", async () => {
    await request(app).post("/api/storage/documents/doc-1").send({ content: "abc" }).expect(200);
    await request(app).get("/api/storage/documents/doc-1").expect(200);

    expect(uploadDocumentMock).toHaveBeenCalledWith("doc-1", { content: "abc" }, "org-1");
    expect(downloadDocumentMock).toHaveBeenCalledWith("doc-1", "org-1");

    await request(app).post("/api/storage/profiles/profile-1").send({ company: "Lucentry.AI" }).expect(200);
    await request(app).get("/api/storage/profiles/profile-1").expect(200);

    expect(uploadCompanyProfileMock).toHaveBeenCalledWith("profile-1", { company: "Lucentry.AI" }, "org-1");
    expect(downloadCompanyProfileMock).toHaveBeenCalledWith("profile-1", "org-1");

    const fileUpload = await request(app)
      .post("/api/storage/files")
      .send({ filename: "report.pdf", folder: "reports", data: Buffer.from("hello").toString("base64") })
      .expect(200);
    expect(fileUpload.body.success).toBe(true);
    expect(fileUpload.body.data.path).toBe("reports/report.pdf");
    expect(uploadFileFromBytesMock).toHaveBeenCalledWith(
      "report.pdf",
      expect.any(Buffer),
      "organizations/org-1/reports",
    );

    const fileDownload = await request(app).get("/api/storage/files/reports/report.pdf").expect(200);
    expect(fileDownload.header["content-type"]).toContain("application/pdf");
    expect(fileDownload.header["content-disposition"]).toContain("report.pdf");
    expect(downloadFileAsBytesMock).toHaveBeenCalledWith("organizations/org-1/reports/report.pdf");
  });

  it("handles list/delete/stats/backup/audit-log endpoints", async () => {
    const listAll = await request(app).get("/api/storage/list").expect(200);
    expect(listAll.body.data.files).toEqual(["reports/c.txt"]);
    expect(listObjectsInFolderMock).toHaveBeenCalledWith("organizations/org-1");

    listObjectsInFolderMock.mockResolvedValueOnce({
      success: true,
      files: ["organizations/org-1/reports/quarterly/q1.pdf"],
    });
    const listFolder = await request(app).get("/api/storage/list?folder=reports").expect(200);
    expect(listFolder.body.data.files).toEqual(["reports/quarterly/q1.pdf"]);
    expect(listObjectsInFolderMock).toHaveBeenCalledWith("organizations/org-1/reports");

    await request(app).delete("/api/storage/objects/reports/old.pdf").expect(200);
    expect(deleteObjectMock).toHaveBeenCalledWith("organizations/org-1/reports/old.pdf");

    const stats = await request(app).get("/api/storage/stats").expect(200);
    expect(stats.body.data.stats.totalFiles).toBe(3);
    expect(getStorageStatsMock).toHaveBeenCalledWith("org-1");

    await request(app).post("/api/storage/backups/backup-1").send({ db: "snapshot" }).expect(200);
    await request(app).get("/api/storage/backups/backup-1").expect(200);
    expect(uploadBackupMock).toHaveBeenCalledWith("backup-1", { db: "snapshot" }, "org-1");
    expect(downloadBackupMock).toHaveBeenCalledWith("backup-1", "org-1");

    const logsPayload = [{ action: "create" }, { action: "read" }];
    await request(app)
      .post("/api/storage/audit-logs/log-1")
      .send({ logs: logsPayload })
      .expect(200);
    expect(uploadAuditLogsMock).toHaveBeenCalledWith("log-1", logsPayload, "org-1");

    expect(incrementCounterMock).toHaveBeenCalled();
    expect(logAuditMock).toHaveBeenCalled();
  });

  it("returns structured errors for failed storage operations", async () => {
    uploadDocumentMock.mockResolvedValueOnce({ success: false, error: "Upload failed hard" });
    const uploadFailure = await request(app).post("/api/storage/documents/doc-fail").send({}).expect(500);
    expect(uploadFailure.body.success).toBe(false);
    expect(uploadFailure.body.error.code).toBe("STORAGE_ERROR");

    downloadDocumentMock.mockResolvedValueOnce({ success: false, error: "Document missing" });
    const downloadFailure = await request(app).get("/api/storage/documents/missing").expect(404);
    expect(downloadFailure.body.error.code).toBe("NOT_FOUND");

    downloadBackupMock.mockResolvedValueOnce({ success: false, error: "Backup missing" });
    const backupFailure = await request(app).get("/api/storage/backups/missing").expect(404);
    expect(backupFailure.body.error.code).toBe("NOT_FOUND");
  });

  it("blocks document/profile storage when tenant ownership check fails", async () => {
    getDocumentWithOrgCheckMock.mockResolvedValueOnce({ authorized: false, document: null });
    const blockedDoc = await request(app).post("/api/storage/documents/doc-x").send({}).expect(404);
    expect(blockedDoc.body.error.code).toBe("NOT_FOUND");

    getCompanyProfileWithOrgCheckMock.mockResolvedValueOnce({ authorized: false, profile: null });
    const blockedProfile = await request(app).get("/api/storage/profiles/profile-x").expect(404);
    expect(blockedProfile.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects invalid storage paths", async () => {
    const invalidFolder = await request(app).get("/api/storage/list?folder=../secrets").expect(400);
    expect(invalidFolder.body.error.code).toBe("INVALID_STORAGE_PATH");

    const invalidUpload = await request(app)
      .post("/api/storage/files")
      .send({ filename: "../evil.sh", folder: "reports", data: Buffer.from("x").toString("base64") })
      .expect(400);
    expect(invalidUpload.body.error.code).toBe("INVALID_STORAGE_PATH");
  });
});
