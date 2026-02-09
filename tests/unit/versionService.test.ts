import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocumentMock = vi.hoisted(() => vi.fn());
const getDocumentVersionsMock = vi.hoisted(() => vi.fn());
const createDocumentVersionMock = vi.hoisted(() => vi.fn());
const updateDocumentMock = vi.hoisted(() => vi.fn());
const getDocumentVersionMock = vi.hoisted(() => vi.fn());
const deleteDocumentVersionMock = vi.hoisted(() => vi.fn());

vi.mock("../../server/storage", () => ({
  storage: {
    getDocument: getDocumentMock,
    getDocumentVersions: getDocumentVersionsMock,
    createDocumentVersion: createDocumentVersionMock,
    updateDocument: updateDocumentMock,
    getDocumentVersion: getDocumentVersionMock,
    deleteDocumentVersion: deleteDocumentVersionMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { versionService } from "../../server/services/versionService";

describe("versionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocumentMock.mockResolvedValue({ id: "doc-1", version: 2, title: "Existing", content: "Old content" });
    getDocumentVersionsMock.mockResolvedValue([{ versionNumber: 2 }]);
    createDocumentVersionMock.mockResolvedValue({ id: "version-3", versionNumber: 3 });
    updateDocumentMock.mockResolvedValue({ id: "doc-1", version: 3 });
    getDocumentVersionMock.mockResolvedValue({ id: "version-1", versionNumber: 1 });
    deleteDocumentVersionMock.mockResolvedValue(undefined);
  });

  it("creates document versions and updates document pointers", async () => {
    const content = "Policy line 1\nPolicy line 2";
    const version = await versionService.createVersion({
      documentId: "doc-1",
      title: "Policy v3",
      content,
      changes: "Updated controls",
      createdBy: "user-1",
    });

    expect(version.id).toBe("version-3");
    expect(createDocumentVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        versionNumber: 3,
        title: "Policy v3",
        content,
        changes: "Updated controls",
        changeType: "minor",
        createdBy: "user-1",
        fileSize: Buffer.byteLength(content, "utf8"),
        checksum: crypto.createHash("sha256").update(content, "utf8").digest("hex"),
        status: "draft",
      }),
    );
    expect(updateDocumentMock).toHaveBeenCalledWith("doc-1", {
      version: 3,
      content,
      title: "Policy v3",
    });
  });

  it("starts versioning from 1 and handles missing document errors", async () => {
    getDocumentVersionsMock.mockResolvedValueOnce([]);
    await versionService.createVersion({
      documentId: "doc-1",
      title: "First Draft",
      content: "v1",
      createdBy: "user-1",
    });
    expect(createDocumentVersionMock).toHaveBeenCalledWith(expect.objectContaining({ versionNumber: 1 }));

    getDocumentMock.mockResolvedValueOnce(null);
    await expect(
      versionService.createVersion({
        documentId: "missing-doc",
        title: "No doc",
        content: "x",
        createdBy: "user-1",
      }),
    ).rejects.toThrow("Document not found");
  });

  it("retrieves history and individual versions", async () => {
    getDocumentVersionsMock.mockResolvedValueOnce([{ versionNumber: 3 }, { versionNumber: 2 }]);
    const history = await versionService.getVersionHistory("doc-1");
    expect(history).toHaveLength(2);

    getDocumentVersionMock.mockResolvedValueOnce({ versionNumber: 2, content: "Body" });
    const version = await versionService.getVersion("doc-1", 2);
    expect(version?.versionNumber).toBe(2);

    getDocumentVersionMock.mockResolvedValueOnce(undefined);
    const missing = await versionService.getVersion("doc-1", 9);
    expect(missing).toBeNull();
  });

  it("restores and compares versions, including failure paths", async () => {
    getDocumentVersionMock.mockResolvedValueOnce({
      versionNumber: 1,
      title: "Original",
      content: "alpha\nbeta",
      checksum: "x",
      fileSize: 10,
    });
    const restored = await versionService.restoreVersion("doc-1", 1, "restorer-1");
    expect(restored.id).toBe("version-3");
    expect(createDocumentVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: "Restored from version 1",
        changeType: "major",
        createdBy: "restorer-1",
      }),
    );

    getDocumentVersionMock.mockResolvedValueOnce(null);
    await expect(versionService.restoreVersion("doc-1", 999, "restorer-1")).rejects.toThrow("Version not found");

    getDocumentVersionMock
      .mockResolvedValueOnce({
        versionNumber: 1,
        title: "v1",
        content: "line A\nline B\nline C",
      })
      .mockResolvedValueOnce({
        versionNumber: 2,
        title: "v2",
        content: "line A\nline X\nline C\nline D",
      });
    const comparison = await versionService.compareVersions("doc-1", 1, 2);
    expect(comparison.diff.modified).toContain("- line B\n+ line X");
    expect(comparison.diff.added).toEqual(["line D"]);
    expect(comparison.diff.removed).toEqual([]);

    getDocumentVersionMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      versionNumber: 2,
      title: "v2",
      content: "content",
    });
    await expect(versionService.compareVersions("doc-1", 1, 2)).rejects.toThrow(
      "One or both versions not found",
    );
  });

  it("verifies integrity and deletes versions with current-version protection", async () => {
    const content = "integrity";
    getDocumentVersionMock.mockResolvedValueOnce({
      content,
      checksum: crypto.createHash("sha256").update(content, "utf8").digest("hex"),
      fileSize: Buffer.byteLength(content, "utf8"),
    });
    await expect(versionService.verifyIntegrity("doc-1", 1)).resolves.toBe(true);

    getDocumentVersionMock.mockResolvedValueOnce({
      content: "mismatch",
      checksum: "bad",
      fileSize: 1,
    });
    await expect(versionService.verifyIntegrity("doc-1", 2)).resolves.toBe(false);

    getDocumentVersionMock.mockRejectedValueOnce(new Error("storage failure"));
    await expect(versionService.verifyIntegrity("doc-1", 3)).resolves.toBe(false);

    getDocumentMock.mockResolvedValueOnce({ id: "doc-1", version: 2 });
    await expect(versionService.deleteVersion("doc-1", 2)).rejects.toThrow("Cannot delete current version");
    expect(deleteDocumentVersionMock).not.toHaveBeenCalled();

    getDocumentMock.mockResolvedValueOnce({ id: "doc-1", version: 1 });
    await versionService.deleteVersion("doc-1", 2);
    expect(deleteDocumentVersionMock).toHaveBeenCalledWith("doc-1", 2);
  });
});

