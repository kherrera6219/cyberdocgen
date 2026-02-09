import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const configState = vi.hoisted(() => ({
  storage: {
    provider: "gcs",
    bucket: "unit-test-bucket",
  },
}));

const bucketExistsMock = vi.hoisted(() => vi.fn());
const bucketFileMock = vi.hoisted(() => vi.fn());
const bucketGetFilesMock = vi.hoisted(() => vi.fn());
const fileSaveMock = vi.hoisted(() => vi.fn());
const fileDownloadMock = vi.hoisted(() => vi.fn());
const fileDeleteMock = vi.hoisted(() => vi.fn());
const fileCreateReadStreamMock = vi.hoisted(() => vi.fn());
const storageBucketMock = vi.hoisted(() => vi.fn());
const storageConstructorMock = vi.hoisted(() => vi.fn());

vi.mock("@google-cloud/storage", () => ({
  Storage: storageConstructorMock,
}));

vi.mock("../../server/config", () => ({
  config: configState,
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { objectStorageService } from "../../server/services/objectStorageService";

describe("objectStorageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    configState.storage.provider = "gcs";
    configState.storage.bucket = "unit-test-bucket";

    bucketExistsMock.mockResolvedValue([true]);
    fileSaveMock.mockResolvedValue(undefined);
    fileDownloadMock.mockResolvedValue([Buffer.from("{}")]);
    fileDeleteMock.mockResolvedValue(undefined);
    fileCreateReadStreamMock.mockReturnValue(Readable.from(["stream-data"]));
    bucketGetFilesMock.mockResolvedValue([[]]);

    bucketFileMock.mockImplementation(() => ({
      save: fileSaveMock,
      download: fileDownloadMock,
      delete: fileDeleteMock,
      createReadStream: fileCreateReadStreamMock,
    }));

    storageBucketMock.mockImplementation(() => ({
      exists: bucketExistsMock,
      file: bucketFileMock,
      getFiles: bucketGetFilesMock,
    }));

    storageConstructorMock.mockImplementation(() => ({
      bucket: storageBucketMock,
    }));

    const serviceState = objectStorageService as any;
    serviceState.initialized = false;
    serviceState.storage = null;
    serviceState.bucket = null;
  });

  it("returns unavailable when provider is not GCS", async () => {
    configState.storage.provider = "local";

    const result = await objectStorageService.uploadDocument("doc-1", { hello: "world" });

    expect(result).toEqual({
      success: false,
      error: "Storage service not available",
    });
    expect(storageConstructorMock).not.toHaveBeenCalled();
  });

  it("returns unavailable when bucket config is missing", async () => {
    configState.storage.bucket = "";

    const result = await objectStorageService.uploadDocument("doc-1", { hello: "world" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not available/i);
    expect(storageConstructorMock).not.toHaveBeenCalled();
  });

  it("uploads and downloads JSON documents", async () => {
    fileDownloadMock.mockResolvedValue([Buffer.from('{"name":"Security Policy"}')]);

    const uploadResult = await objectStorageService.uploadDocument("doc-1", { name: "Security Policy" });
    const downloadResult = await objectStorageService.downloadDocument("doc-1");

    expect(uploadResult).toMatchObject({
      success: true,
      path: "documents/doc-1.json",
    });
    expect(fileSaveMock).toHaveBeenCalledWith(expect.stringContaining('"name": "Security Policy"'));
    expect(downloadResult.success).toBe(true);
    expect(downloadResult.data).toEqual({ name: "Security Policy" });
  });

  it("returns parse errors when stored JSON is invalid", async () => {
    fileDownloadMock.mockResolvedValue([Buffer.from("not-json")]);

    const docResult = await objectStorageService.downloadDocument("doc-2");
    const profileResult = await objectStorageService.downloadCompanyProfile("profile-1");
    const backupResult = await objectStorageService.downloadBackup("backup-1");

    expect(docResult).toEqual({ success: false, error: "Failed to parse document JSON" });
    expect(profileResult).toEqual({ success: false, error: "Failed to parse profile JSON" });
    expect(backupResult).toEqual({ success: false, error: "Failed to parse backup JSON" });
  });

  it("lists objects in folder with normalized prefix", async () => {
    bucketGetFilesMock.mockResolvedValue([[{ name: "files/a.txt" }, { name: "files/b.txt" }]]);

    const result = await objectStorageService.listObjectsInFolder("files");

    expect(result).toEqual({
      success: true,
      files: ["files/a.txt", "files/b.txt"],
    });
    expect(bucketGetFilesMock).toHaveBeenCalledWith({ prefix: "files/" });
  });

  it("handles stream downloads and delete failures", async () => {
    fileDeleteMock.mockRejectedValue(new Error("delete denied"));

    const streamResult = await objectStorageService.downloadAsStream("files/a.txt");
    const deleteResult = await objectStorageService.deleteObject("files/a.txt");

    expect(streamResult.success).toBe(true);
    expect(streamResult.data).toBeInstanceOf(Readable);
    expect(deleteResult).toEqual({
      success: false,
      error: "delete denied",
    });
  });

  it("computes storage statistics by folder", async () => {
    bucketGetFilesMock.mockResolvedValue([
      [
        { name: "documents/a.json" },
        { name: "profiles/p.json" },
        { name: "backups/b.json" },
        { name: "audit-logs/log-1.json" },
        { name: "files/raw.bin" },
        { name: "orphan.bin" },
      ],
    ]);

    const result = await objectStorageService.getStorageStats();
    expect(result.success).toBe(true);
    expect(result.data.totalFiles).toBe(6);
    expect(result.data.byFolder).toMatchObject({
      documents: 1,
      profiles: 1,
      backups: 1,
      auditLogs: 1,
      files: 1,
      other: 1,
    });
  });

  it("returns failure when bucket does not exist or listing fails", async () => {
    bucketExistsMock.mockResolvedValue([false]);

    const unavailable = await objectStorageService.uploadFileFromBytes("x.txt", Buffer.from("x"));
    expect(unavailable).toEqual({
      success: false,
      error: "Storage service not available",
    });

    const serviceState = objectStorageService as any;
    serviceState.initialized = false;
    serviceState.storage = null;
    serviceState.bucket = null;
    bucketExistsMock.mockResolvedValue([true]);
    bucketGetFilesMock.mockRejectedValue(new Error("list failed"));

    const stats = await objectStorageService.getStorageStats();
    expect(stats.success).toBe(false);
    expect(stats.error).toBe("Failed to get storage stats");
  });
});
