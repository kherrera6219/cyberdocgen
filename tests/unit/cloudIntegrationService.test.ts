import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudIntegrationService } from "../../server/services/cloudIntegrationService";
import { db } from "../../server/db";
import { systemConfigService } from "../../server/services/systemConfigService";
import { auditService } from "../../server/services/auditService";
import { encryptionService } from "../../server/services/encryption";
import { Client } from "@microsoft/microsoft-graph-client";
import { OAuth2Client } from "google-auth-library";

const dbMocks = vi.hoisted(() => {
  const returningMock = vi.fn().mockResolvedValue([{ id: "int-1" }]);
  const onConflictDoUpdateMock = vi.fn(() => ({ returning: returningMock }));
  const valuesMock = vi.fn(() => ({
    onConflictDoUpdate: onConflictDoUpdateMock,
    returning: returningMock,
  }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));

  const updateWhereMock = vi.fn().mockResolvedValue({ rowCount: 1 });
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));

  const deleteWhereMock = vi.fn().mockResolvedValue({ rowCount: 1 });
  const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

  const cloudIntegrationsFindFirst = vi.fn();
  const cloudIntegrationsFindMany = vi.fn();
  const cloudFilesFindFirst = vi.fn();
  const cloudFilesFindMany = vi.fn();

  return {
    insertMock,
    valuesMock,
    onConflictDoUpdateMock,
    returningMock,
    updateMock,
    updateSetMock,
    updateWhereMock,
    deleteMock,
    deleteWhereMock,
    cloudIntegrationsFindFirst,
    cloudIntegrationsFindMany,
    cloudFilesFindFirst,
    cloudFilesFindMany,
  };
});

const googleMocks = vi.hoisted(() => ({
  generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.test/auth"),
  getToken: vi.fn().mockResolvedValue({
    tokens: {
      access_token: "google-access-token",
      refresh_token: "google-refresh-token",
      expiry_date: Date.now() + 60_000,
    },
  }),
  setCredentials: vi.fn(),
  request: vi.fn().mockResolvedValue({
    data: { id: "google-user", email: "user@example.com", name: "Google User" },
  }),
  driveList: vi.fn().mockResolvedValue({
    data: {
      files: [
        {
          id: "f1",
          name: "policy.pdf",
          mimeType: "application/pdf",
          size: "1200",
          modifiedTime: new Date("2026-01-01").toISOString(),
          webViewLink: "https://drive.test/view",
          webContentLink: "https://drive.test/download",
        },
      ],
    },
  }),
}));

const oneDriveMocks = vi.hoisted(() => ({
  graphGet: vi.fn().mockResolvedValue({
    value: [
      {
        id: "od-1",
        name: "control-plan.docx",
        file: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        size: 2048,
        lastModifiedDateTime: new Date("2026-01-03").toISOString(),
        webUrl: "https://onedrive.test/view",
        "@microsoft.graph.downloadUrl": "https://onedrive.test/download",
      },
    ],
  }),
}));

vi.mock("../../server/db", () => ({
  db: {
    insert: dbMocks.insertMock,
    update: dbMocks.updateMock,
    delete: dbMocks.deleteMock,
    query: {
      cloudIntegrations: {
        findFirst: dbMocks.cloudIntegrationsFindFirst,
        findMany: dbMocks.cloudIntegrationsFindMany,
      },
      cloudFiles: {
        findFirst: dbMocks.cloudFilesFindFirst,
        findMany: dbMocks.cloudFilesFindMany,
      },
    },
  },
}));

vi.mock("../../server/services/systemConfigService", () => ({
  systemConfigService: {
    getOAuthCredentials: vi.fn(),
  },
}));

vi.mock("../../server/services/encryption", () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn().mockResolvedValue({ iv: "iv", content: "enc" }),
    decryptSensitiveField: vi.fn().mockResolvedValue("plain-token"),
  },
  DataClassification: {
    RESTRICTED: "restricted",
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
  },
  AuditAction: {
    CREATE: "create",
    READ: "read",
    UPDATE: "update",
    DELETE: "delete",
  },
  RiskLevel: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../server/utils/circuitBreaker", () => ({
  circuitBreakers: {
    cloudStorage: {
      execute: vi.fn((fn) => fn()),
    },
  },
}));

vi.mock("@googleapis/drive", () => ({
  drive: vi.fn(() => ({
    files: {
      list: googleMocks.driveList,
    },
  })),
  drive_v3: {},
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn(() => ({
    generateAuthUrl: googleMocks.generateAuthUrl,
    getToken: googleMocks.getToken,
    setCredentials: googleMocks.setCredentials,
    request: googleMocks.request,
  })),
}));

vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    initWithMiddleware: vi.fn(() => ({
      api: vi.fn(() => ({
        filter: vi.fn(() => ({
          select: vi.fn(() => ({
            top: vi.fn(() => ({
              get: oneDriveMocks.graphGet,
            })),
          })),
        })),
      })),
    })),
  },
  AuthenticationProvider: class {},
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("CloudIntegrationService", () => {
  let service: CloudIntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CloudIntegrationService();

    vi.mocked(systemConfigService.getOAuthCredentials).mockResolvedValue({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    dbMocks.returningMock.mockResolvedValue([{ id: "int-1" }]);
    dbMocks.deleteWhereMock.mockResolvedValue({ rowCount: 1 });
    dbMocks.cloudFilesFindMany.mockResolvedValue([{ id: "file-1" }]);
  });

  describe("Auth URLs and callbacks", () => {
    it("builds Google auth URL when credentials exist", async () => {
      const authUrl = await service.getGoogleAuthUrl("http://localhost/callback");

      expect(authUrl).toBe("https://accounts.google.test/auth");
      expect(OAuth2Client).toHaveBeenCalled();
      expect(googleMocks.generateAuthUrl).toHaveBeenCalledTimes(1);
    });

    it("throws when Google credentials are not configured", async () => {
      vi.mocked(systemConfigService.getOAuthCredentials).mockResolvedValueOnce(null);

      await expect(
        service.getGoogleAuthUrl("http://localhost/callback")
      ).rejects.toThrow("Google OAuth credentials not configured");
    });

    it("handles Google callback and creates integration", async () => {
      const integrationId = await service.handleGoogleCallback(
        "code-123",
        "http://localhost/callback",
        "user-1",
        "org-1"
      );

      expect(integrationId).toBe("int-1");
      expect(googleMocks.getToken).toHaveBeenCalledWith("code-123");
      expect(googleMocks.request).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it("builds Microsoft auth URL", async () => {
      const authUrl = await service.getMicrosoftAuthUrl("http://localhost/ms");
      expect(authUrl).toContain(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
      );
      expect(authUrl).toContain(encodeURIComponent("http://localhost/ms"));
    });

    it("throws when Microsoft credentials are not configured", async () => {
      vi.mocked(systemConfigService.getOAuthCredentials).mockResolvedValueOnce(null);

      await expect(
        service.getMicrosoftAuthUrl("http://localhost/ms")
      ).rejects.toThrow("Microsoft OAuth credentials not configured");
    });

    it("handles Microsoft callback and creates integration", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          access_token: "ms-access-token",
          refresh_token: "ms-refresh-token",
          expires_in: 3600,
        },
      } as any);
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          id: "ms-user",
          userPrincipalName: "user@contoso.com",
          displayName: "Contoso User",
        },
      } as any);

      const integrationId = await service.handleMicrosoftCallback(
        "ms-code",
        "http://localhost/ms",
        "user-1",
        "org-1"
      );

      expect(integrationId).toBe("int-1");
      expect(axios.post).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe("syncFiles", () => {
    it("syncs Google Drive files and completes successfully", async () => {
      dbMocks.cloudIntegrationsFindFirst.mockResolvedValue({
        id: "int-1",
        userId: "user-1",
        organizationId: "org-1",
        provider: "google_drive",
        accessTokenEncrypted: JSON.stringify({ iv: "iv", content: "enc" }),
        isActive: true,
      });

      const result = await service.syncFiles("int-1");

      expect(result).toEqual({ synced: 1, errors: 0 });
      expect(encryptionService.decryptSensitiveField).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalledTimes(2);
      expect(dbMocks.updateSetMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ syncStatus: "completed" })
      );
    });

    it("syncs OneDrive files and stores non-PDF security defaults", async () => {
      dbMocks.cloudIntegrationsFindFirst.mockResolvedValue({
        id: "int-1",
        userId: "user-1",
        organizationId: "org-1",
        provider: "onedrive",
        accessTokenEncrypted: JSON.stringify({ iv: "iv", content: "enc" }),
        isActive: true,
      });

      const result = await service.syncFiles("int-1");
      expect(result).toEqual({ synced: 1, errors: 0 });

      const upsertPayload = dbMocks.valuesMock.mock.calls[0][0];
      expect(Client.initWithMiddleware).toHaveBeenCalled();
      expect(upsertPayload).toEqual(
        expect.objectContaining({
          fileName: "control-plan.docx",
          fileType: "docx",
          securityLevel: "standard",
          isSecurityLocked: false,
          permissions: expect.objectContaining({
            canDownload: true,
          }),
        })
      );
    });

    it("tracks file-level sync errors and sets integration status to error", async () => {
      dbMocks.cloudIntegrationsFindFirst.mockResolvedValue({
        id: "int-1",
        userId: "user-1",
        organizationId: "org-1",
        provider: "google_drive",
        accessTokenEncrypted: JSON.stringify({ iv: "iv", content: "enc" }),
        isActive: true,
      });
      googleMocks.driveList.mockResolvedValueOnce({
        data: {
          files: [
            {
              id: "bad-1",
              name: "bad.pdf",
              mimeType: "application/pdf",
              size: "100",
              modifiedTime: new Date("2026-01-01").toISOString(),
            },
            {
              id: "ok-2",
              name: "ok.pdf",
              mimeType: "application/pdf",
              size: "120",
              modifiedTime: new Date("2026-01-02").toISOString(),
            },
          ],
        },
      });
      dbMocks.onConflictDoUpdateMock
        .mockImplementationOnce(() => {
          throw new Error("db write failed");
        })
        .mockImplementationOnce(() => ({}));

      const result = await service.syncFiles("int-1");

      expect(result).toEqual({ synced: 1, errors: 1 });
      expect(dbMocks.updateSetMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ syncStatus: "error" })
      );
    });

    it("throws for inactive integrations and still marks sync status as error", async () => {
      dbMocks.cloudIntegrationsFindFirst.mockResolvedValue(null);

      await expect(service.syncFiles("int-404")).rejects.toThrow(
        "Cloud integration not found or inactive"
      );
      expect(dbMocks.updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({ syncStatus: "error" })
      );
    });
  });

  describe("File access and security operations", () => {
    it("applies PDF security for PDF files", async () => {
      dbMocks.cloudFilesFindFirst.mockResolvedValue({
        id: "file-1",
        fileName: "security-plan.pdf",
        fileType: "pdf",
      });

      const result = await service.applyPDFSecurity(
        "file-1",
        {
          securityLevel: "confidential",
          permissions: {
            canView: true,
            canEdit: false,
            canDownload: false,
            canShare: false,
          },
          watermark: { enabled: true, text: "Internal", opacity: 0.3 },
        },
        "user-1"
      );

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalled();
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it("rejects PDF security for non-PDF files", async () => {
      dbMocks.cloudFilesFindFirst.mockResolvedValue({
        id: "file-2",
        fileName: "sheet.xlsx",
        fileType: "xlsx",
      });

      await expect(
        service.applyPDFSecurity(
          "file-2",
          {
            securityLevel: "restricted",
            permissions: {
              canView: true,
              canEdit: false,
              canDownload: false,
              canShare: false,
            },
          },
          "user-1"
        )
      ).rejects.toThrow("File not found or not a PDF");
    });

    it("lists organization files with optional filters", async () => {
      const files = await service.getOrganizationFiles("org-1", {
        fileType: "pdf",
        securityLevel: "restricted",
      });

      expect(files).toEqual([{ id: "file-1" }]);
      expect(dbMocks.cloudFilesFindMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integrations listing and deletion", () => {
    it("returns user integrations", async () => {
      dbMocks.cloudIntegrationsFindMany.mockResolvedValueOnce([{ id: "int-2" }]);

      const integrations = await service.getUserIntegrations("user-1");
      expect(integrations).toEqual([{ id: "int-2" }]);
    });

    it("returns false when integration delete does not affect a row", async () => {
      dbMocks.deleteWhereMock.mockResolvedValueOnce({ rowCount: 0 });

      const deleted = await service.deleteIntegration("int-1", "user-1");
      expect(deleted).toBe(false);
    });

    it("returns true when integration delete succeeds", async () => {
      const deleted = await service.deleteIntegration("int-1", "user-1");

      expect(deleted).toBe(true);
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });
  });

  describe("private helpers", () => {
    it("classifies additional mime types through getFileTypeFromMime", () => {
      const getType = (service as any).getFileTypeFromMime.bind(service);

      expect(getType("application/vnd.ms-powerpoint")).toBe("pptx");
      expect(getType("application/octet-stream")).toBe("other");
    });
  });
});
