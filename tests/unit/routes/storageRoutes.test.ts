import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));
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

    uploadDocumentMock.mockResolvedValue({ success: true, path: "storage/doc-1.json" });
    downloadDocumentMock.mockResolvedValue({ success: true, data: { id: "doc-1" } });
    uploadCompanyProfileMock.mockResolvedValue({ success: true, path: "profiles/profile-1.json" });
    downloadCompanyProfileMock.mockResolvedValue({ success: true, data: { id: "profile-1" } });
    uploadFileFromBytesMock.mockResolvedValue({ success: true, path: "files/file-1.pdf" });
    downloadFileAsBytesMock.mockResolvedValue({ success: true, data: Buffer.from("pdf-bytes") });
    listObjectsMock.mockResolvedValue({ success: true, files: ["a.txt", "b.txt"] });
    listObjectsInFolderMock.mockResolvedValue({ success: true, files: ["folder/c.txt"] });
    deleteObjectMock.mockResolvedValue({ success: true });
    getStorageStatsMock.mockResolvedValue({ success: true, data: { totalFiles: 3, totalSize: 1024 } });
    uploadBackupMock.mockResolvedValue({ success: true, path: "backup/backup-1.json" });
    downloadBackupMock.mockResolvedValue({ success: true, data: { backupId: "backup-1" } });
    uploadAuditLogsMock.mockResolvedValue({ success: true, path: "audit/log-1.json" });
    logAuditMock.mockResolvedValue(undefined);
  });

  it("handles document/profile/file upload and download operations", async () => {
    await request(app).post("/api/storage/documents/doc-1").send({ content: "abc" }).expect(200);
    await request(app).get("/api/storage/documents/doc-1").expect(200);

    await request(app).post("/api/storage/profiles/profile-1").send({ company: "Lucentry.AI" }).expect(200);
    await request(app).get("/api/storage/profiles/profile-1").expect(200);

    const fileUpload = await request(app)
      .post("/api/storage/files")
      .send({ filename: "report.pdf", folder: "reports", data: Buffer.from("hello").toString("base64") })
      .expect(200);
    expect(fileUpload.body.success).toBe(true);
    expect(uploadFileFromBytesMock).toHaveBeenCalledWith(
      "report.pdf",
      expect.any(Buffer),
      "reports",
    );

    const fileDownload = await request(app).get("/api/storage/files/reports/report.pdf").expect(200);
    expect(fileDownload.header["content-type"]).toContain("application/pdf");
    expect(fileDownload.header["content-disposition"]).toContain("report.pdf");
    expect(downloadFileAsBytesMock).toHaveBeenCalledWith("reports/report.pdf");
  });

  it("handles list/delete/stats/backup/audit-log endpoints", async () => {
    const listAll = await request(app).get("/api/storage/list").expect(200);
    expect(listAll.body.data.files).toEqual(["a.txt", "b.txt"]);
    expect(listObjectsMock).toHaveBeenCalledTimes(1);

    const listFolder = await request(app).get("/api/storage/list?folder=reports").expect(200);
    expect(listFolder.body.data.files).toEqual(["folder/c.txt"]);
    expect(listObjectsInFolderMock).toHaveBeenCalledWith("reports");

    await request(app).delete("/api/storage/objects/reports/old.pdf").expect(200);
    expect(deleteObjectMock).toHaveBeenCalledWith("reports/old.pdf");

    const stats = await request(app).get("/api/storage/stats").expect(200);
    expect(stats.body.data.stats.totalFiles).toBe(3);

    await request(app).post("/api/storage/backups/backup-1").send({ db: "snapshot" }).expect(200);
    await request(app).get("/api/storage/backups/backup-1").expect(200);

    await request(app)
      .post("/api/storage/audit-logs/log-1")
      .send({ logs: [{ action: "create" }, { action: "read" }] })
      .expect(200);

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
});
