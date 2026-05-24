import { Router, Request, Response } from "express";
import { isAuthenticated, getRequiredUserId } from "../replitAuth";
import { trustCenterService } from "../services/trustCenterService";
import { 
  secureHandler, 
  ValidationError, 
  NotFoundError 
} from "../utils/errorHandling";
import { 
  type MultiTenantRequest, 
  requireOrganization 
} from "../middleware/multiTenant";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs";

export function registerTrustCenterRoutes(app: Router) {
  const router = Router();

  /**
   * GET /api/trust-center/documents
   * List all downloadable security documents
   */
  router.get("/documents", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const result = await trustCenterService.getTrustCenterDocuments(organizationId);
    res.json({ success: true, data: result });
  }));

  /**
   * POST /api/trust-center/sign
   * Sign Gated NDA agreement for security document access
   */
  router.post("/sign", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { fullName, email, companyName } = req.body;

    if (!fullName || !email || !companyName) {
      throw new ValidationError("Missing required field parameters: fullName, email, companyName");
    }

    const nda = await trustCenterService.signNda({
      organizationId,
      fullName,
      email,
      companyName
    });

    res.status(201).json({ success: true, data: nda });
  }));

  /**
   * POST /api/trust-center/check-nda
   * Verify if a buyer has a signed NDA
   */
  router.post("/check-nda", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email parameter is required");
    }

    const nda = await trustCenterService.checkNdaStatus(organizationId, email);
    res.json({ 
      success: true, 
      signed: !!nda, 
      nda: nda || null 
    });
  }));

  /**
   * GET /api/trust-center/download/:id
   * Secure, watermark, and download security document
   */
  router.get("/download/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const { ndaId, type = "file" } = req.query;

    if (!ndaId || typeof ndaId !== "string") {
      throw new ValidationError("Valid signed NDA ID (ndaId) parameter is required to access restricted files");
    }

    if (type !== "file" && type !== "policy") {
      throw new ValidationError("Invalid download document type. Allowed: 'file', 'policy'");
    }

    try {
      const result = await trustCenterService.secureAndDownloadFile({
        organizationId,
        ndaId,
        targetId: id,
        targetType: type,
        ipAddress: req.ip || "unknown"
      });

      if (!fs.existsSync(result.filePath)) {
        throw new NotFoundError("Secured PDF file could not be mapped on disk");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      
      const fileStream = fs.createReadStream(result.filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      logger.error("[TrustCenterRoutes] Secure download failed:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to download secured document" });
    }
  }));

  /**
   * GET /api/trust-center/downloads-audit
   * Retrieve continuous downloads transaction logs for admin audits
   */
  router.get("/downloads-audit", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const auditLogs = await storage.getTrustCenterDownloadsByOrg(organizationId);
    res.json({ success: true, data: auditLogs });
  }));

  app.use("/api/trust-center", router);
}
