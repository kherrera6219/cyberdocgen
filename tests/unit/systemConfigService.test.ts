import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemConfigService } from "../../server/services/systemConfigService";
import { db } from "../../server/db";
import { encryptionService } from "../../server/services/encryption";
import { auditService } from "../../server/services/auditService";

const dbMocks = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  const deleteWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
  const deleteMock = vi.fn(() => ({ where: deleteWhere }));

  const findFirst = vi.fn();

  return {
    insert,
    values,
    onConflictDoUpdate,
    deleteMock,
    deleteWhere,
    findFirst,
  };
});

vi.mock("../../server/db", () => ({
  db: {
    insert: dbMocks.insert,
    delete: dbMocks.deleteMock,
    query: {
      systemConfigurations: {
        findFirst: dbMocks.findFirst,
      },
    },
  },
}));

vi.mock("../../server/services/encryption", () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn().mockResolvedValue({ iv: "iv", content: "enc" }),
    decryptSensitiveField: vi.fn().mockResolvedValue(
      JSON.stringify({ clientId: "client-id-1234", clientSecret: "secret-xyz" })
    ),
  },
  DataClassification: {
    RESTRICTED: "restricted",
    INTERNAL: "internal",
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
  },
  AuditAction: {
    UPDATE: "update",
    DELETE: "delete",
  },
  RiskLevel: {
    HIGH: "high",
    MEDIUM: "medium",
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SystemConfigService", () => {
  let service: SystemConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SystemConfigService();
  });

  describe("getOAuthCredentials", () => {
    it("returns decrypted OAuth credentials for active configs", async () => {
      dbMocks.findFirst.mockResolvedValueOnce({
        configValueEncrypted: JSON.stringify({ iv: "x", content: "y" }),
        isActive: true,
      });

      const credentials = await service.getOAuthCredentials("google");

      expect(credentials).toEqual({
        clientId: "client-id-1234",
        clientSecret: "secret-xyz",
      });
      expect(encryptionService.decryptSensitiveField).toHaveBeenCalled();
    });

    it("returns null for missing or inactive configs", async () => {
      dbMocks.findFirst.mockResolvedValueOnce(null);
      await expect(service.getOAuthCredentials("google")).resolves.toBeNull();

      dbMocks.findFirst.mockResolvedValueOnce({ isActive: false });
      await expect(service.getOAuthCredentials("microsoft")).resolves.toBeNull();
    });

    it("returns null when decrypt/query fails", async () => {
      dbMocks.findFirst.mockRejectedValueOnce(new Error("db failure"));
      await expect(service.getOAuthCredentials("google")).resolves.toBeNull();
    });
  });

  describe("setOAuthCredentials", () => {
    it("stores encrypted OAuth credentials and writes audit events", async () => {
      const ok = await service.setOAuthCredentials(
        "google",
        { clientId: "new-client", clientSecret: "new-secret" },
        "user-1",
        "127.0.0.1"
      );

      expect(ok).toBe(true);
      expect(db.insert).toHaveBeenCalled();
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it("returns false when credential storage fails", async () => {
      vi.mocked(encryptionService.encryptSensitiveField).mockRejectedValueOnce(
        new Error("encrypt failed")
      );

      const ok = await service.setOAuthCredentials(
        "microsoft",
        { clientId: "new-client", clientSecret: "new-secret" },
        "user-1",
        "127.0.0.1"
      );

      expect(ok).toBe(false);
    });
  });

  describe("PDF defaults", () => {
    it("returns platform defaults when config is missing", async () => {
      dbMocks.findFirst.mockResolvedValueOnce(null);

      const defaults = await service.getPDFDefaults();
      expect(defaults.defaultEncryptionLevel).toBe("AES256");
      expect(defaults.defaultWatermarkText).toBe("CONFIDENTIAL");
    });

    it("returns decrypted PDF defaults when config exists", async () => {
      dbMocks.findFirst.mockResolvedValueOnce({
        configValueEncrypted: JSON.stringify({ iv: "x", content: "y" }),
        isActive: true,
      });
      vi.mocked(encryptionService.decryptSensitiveField).mockResolvedValueOnce(
        JSON.stringify({
          defaultEncryptionLevel: "AES128",
          defaultAllowPrinting: true,
          defaultAllowCopying: true,
          defaultAllowModifying: false,
          defaultAllowAnnotations: true,
          defaultWatermarkText: "INTERNAL",
          defaultWatermarkOpacity: 0.5,
        })
      );

      const defaults = await service.getPDFDefaults();
      expect(defaults.defaultEncryptionLevel).toBe("AES128");
      expect(defaults.defaultWatermarkText).toBe("INTERNAL");
    });

    it("falls back to platform defaults on getPDFDefaults errors", async () => {
      dbMocks.findFirst.mockRejectedValueOnce(new Error("query failed"));

      const defaults = await service.getPDFDefaults();
      expect(defaults.defaultEncryptionLevel).toBe("AES256");
      expect(defaults.defaultAllowPrinting).toBe(false);
    });

    it("stores PDF defaults and returns false on failure", async () => {
      const success = await service.setPDFDefaults(
        {
          defaultEncryptionLevel: "AES256",
          defaultAllowPrinting: false,
          defaultAllowCopying: false,
          defaultAllowModifying: false,
          defaultAllowAnnotations: false,
          defaultWatermarkText: "CONFIDENTIAL",
          defaultWatermarkOpacity: 0.4,
        },
        "user-1",
        "127.0.0.1"
      );
      expect(success).toBe(true);

      vi.mocked(encryptionService.encryptSensitiveField).mockRejectedValueOnce(
        new Error("encrypt fail")
      );
      const failed = await service.setPDFDefaults(
        {
          defaultEncryptionLevel: "AES256",
          defaultAllowPrinting: false,
          defaultAllowCopying: false,
          defaultAllowModifying: false,
          defaultAllowAnnotations: false,
          defaultWatermarkText: "CONFIDENTIAL",
          defaultWatermarkOpacity: 0.4,
        },
        "user-1",
        "127.0.0.1"
      );
      expect(failed).toBe(false);
    });
  });

  describe("OAuth status and UI settings", () => {
    it("returns true only when provider credentials are complete", async () => {
      vi.spyOn(service, "getOAuthCredentials")
        .mockResolvedValueOnce({
          clientId: "client",
          clientSecret: "secret",
        })
        .mockResolvedValueOnce({
          clientId: "",
          clientSecret: "secret",
        } as any);

      await expect(service.isOAuthConfigured("google")).resolves.toBe(true);
      await expect(service.isOAuthConfigured("microsoft")).resolves.toBe(false);
    });

    it("returns masked OAuth settings for UI display", async () => {
      vi.spyOn(service, "isOAuthConfigured")
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      vi.spyOn(service, "getOAuthCredentials")
        .mockResolvedValueOnce({
          clientId: "google-client-id-long",
          clientSecret: "secret",
        })
        .mockResolvedValueOnce({
          clientId: "microsoft-client-id-long",
          clientSecret: "secret",
        });

      const settings = await service.getOAuthSettingsForUI();
      expect(settings).toEqual({
        googleConfigured: true,
        microsoftConfigured: true,
        googleClientId: "google-c...",
        microsoftClientId: "microsof...",
      });
    });

    it("returns safe defaults when UI settings lookup fails", async () => {
      vi.spyOn(service, "isOAuthConfigured").mockRejectedValueOnce(
        new Error("status failed")
      );

      const settings = await service.getOAuthSettingsForUI();
      expect(settings).toEqual({
        googleConfigured: false,
        microsoftConfigured: false,
        googleClientId: "",
        microsoftClientId: "",
      });
    });
  });

  describe("deleteOAuthCredentials", () => {
    it("deletes provider credentials and audits when rows were affected", async () => {
      dbMocks.deleteWhere.mockResolvedValueOnce({ rowCount: 1 });

      const deleted = await service.deleteOAuthCredentials(
        "google",
        "user-1",
        "127.0.0.1"
      );

      expect(deleted).toBe(true);
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it("returns false when no rows were deleted or query fails", async () => {
      dbMocks.deleteWhere.mockResolvedValueOnce({ rowCount: 0 });
      await expect(
        service.deleteOAuthCredentials("microsoft", "user-1", "127.0.0.1")
      ).resolves.toBe(false);

      dbMocks.deleteWhere.mockRejectedValueOnce(new Error("delete failed"));
      await expect(
        service.deleteOAuthCredentials("google", "user-1", "127.0.0.1")
      ).resolves.toBe(false);
    });
  });
});
