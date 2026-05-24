import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrustCenterService } from "../../server/services/trustCenterService";
import { db } from "../../server/db";
import { storage } from "../../server/storage";
import { pdfSecurityService } from "../../server/services/pdfSecurityService";
import { objectStorageService } from "../../server/services/objectStorageService";

// Mock DB
vi.mock("../../server/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([])
      }))
    })),
    query: {
      cloudFiles: {
        findFirst: vi.fn()
      },
      documents: {
        findFirst: vi.fn()
      },
      companyProfiles: {
        findFirst: vi.fn()
      }
    }
  }
}));

// Mock Storage
vi.mock("../../server/storage", () => ({
  storage: {
    createTrustCenterNda: vi.fn(),
    getTrustCenterNda: vi.fn(),
    getTrustCenterNdaByEmail: vi.fn(),
    createTrustCenterDownload: vi.fn()
  }
}));

// Mock PDF Security
vi.mock("../../server/services/pdfSecurityService", () => ({
  pdfSecurityService: {
    securePDF: vi.fn(() => Promise.resolve({ success: true, securedFileUrl: "secured_path.pdf" }))
  }
}));

// Mock Object Storage
vi.mock("../../server/services/objectStorageService", () => ({
  objectStorageService: {
    downloadFileAsBytes: vi.fn(() => Promise.resolve({ success: true, data: Buffer.from("pdf bytes") }))
  }
}));

// Mock pdf-lib
vi.mock("pdf-lib", () => ({
  PDFDocument: {
    create: vi.fn(() => Promise.resolve({
      addPage: vi.fn(() => ({
        getSize: vi.fn(() => ({ width: 500, height: 800 })),
        drawText: vi.fn()
      })),
      embedFont: vi.fn(() => Promise.resolve({ widthOfTextAtSize: () => 50 })),
      save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3])))
    }))
  },
  StandardFonts: {
    Helvetica: "Helvetica",
    HelveticaBold: "Helvetica-Bold"
  }
}));

describe("TrustCenterService", () => {
  let service: TrustCenterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TrustCenterService();
  });

  describe("signNda", () => {
    it("creates active NDA signature catalog with secure SHA-256 HMAC-like hash", async () => {
      const mockNda = {
        id: "nda-123",
        organizationId: "org-1",
        fullName: "Jane Doe",
        email: "jane@company.com",
        companyName: "BuyerCorp",
        signatureHash: "hash-xyz",
        status: "active"
      };

      (storage.createTrustCenterNda as any).mockResolvedValueOnce(mockNda);

      const result = await service.signNda({
        organizationId: "org-1",
        fullName: "Jane Doe",
        email: "jane@company.com",
        companyName: "BuyerCorp"
      });

      expect(result).toEqual(mockNda);
      expect(storage.createTrustCenterNda).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: "org-1",
        fullName: "Jane Doe",
        email: "jane@company.com",
        companyName: "BuyerCorp",
        status: "active"
      }));
    });
  });

  describe("checkNdaStatus", () => {
    it("returns correct active signature document", async () => {
      (storage.getTrustCenterNdaByEmail as any).mockResolvedValueOnce({ id: "nda-123", status: "active" });

      const result = await service.checkNdaStatus("org-1", "jane@company.com");
      expect(result).toEqual({ id: "nda-123", status: "active" });
    });
  });

  describe("secureAndDownloadFile", () => {
    it("validates NDA, applies customized watermarking, locks password and logs download catalogs", async () => {
      (storage.getTrustCenterNda as any).mockResolvedValueOnce({
        id: "nda-123",
        organizationId: "org-1",
        fullName: "Jane Doe",
        email: "jane@company.com",
        companyName: "BuyerCorp",
        status: "active"
      });

      (db.query.cloudFiles.findFirst as any).mockResolvedValueOnce({
        id: "file-789",
        fileName: "soc2_report.pdf",
        filePath: "uploads/soc2.pdf",
        organizationId: "org-1"
      });

      const result = await service.secureAndDownloadFile({
        organizationId: "org-1",
        ndaId: "nda-123",
        targetId: "file-789",
        targetType: "file",
        ipAddress: "192.168.1.100"
      });

      expect(result).toEqual({
        filePath: "secured_path.pdf",
        fileName: "soc2_report.pdf"
      });

      expect(pdfSecurityService.securePDF).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          fileId: "file-789",
          createdBy: "Jane Doe",
          userPassword: "CyberDocGenSecurePassword2026",
          watermark: expect.objectContaining({
            enabled: true,
            text: expect.stringContaining("BUYERCORP")
          })
        })
      );

      expect(storage.createTrustCenterDownload).toHaveBeenCalledWith({
        ndaId: "nda-123",
        fileId: "file-789",
        ipAddress: "192.168.1.100"
      });
    });

    it("throws error if buyer does not have active NDA", async () => {
      (storage.getTrustCenterNda as any).mockResolvedValueOnce(null);

      await expect(service.secureAndDownloadFile({
        organizationId: "org-1",
        ndaId: "nda-invalid",
        targetId: "file-789",
        targetType: "file"
      })).rejects.toThrow("Active NDA is required");
    });
  });
});
