import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { auditService, AuditAction } from "../services/auditService";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────
const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  serviceDescription: z.string().max(2000).optional().nullable(),
  dataClassification: z.enum(["public", "standard", "confidential", "restricted"]).optional().default("standard"),
  securityStatus: z.enum(["pending", "approved", "requires_review", "rejected"]).optional().default("pending"),
  soc2Status: z.enum(["reviewed", "not_provided", "na"]).optional().default("not_provided"),
  iso27001Status: z.enum(["reviewed", "not_provided", "na"]).optional().default("not_provided"),
  lastAssessmentDate: z.string().datetime().optional().nullable(),
});

const updateVendorSchema = createVendorSchema.partial();

// ─── Helper: extract org id ───────────────────────────────────────────────────
function getOrgId(req: Request): string | null {
  return (req as any).organizationId || req.session?.organizationId || null;
}

// ─── GET /api/vendors ─────────────────────────────────────────────────────────
router.get("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrgId(req);
    if (!organizationId) {
      res.status(400).json({ message: "Organization context required" });
      return;
    }
    const vendors = await storage.getVendors(organizationId);
    res.json(vendors);
  } catch (error) {
    logger.error("[VendorRoutes] Failed to list vendors:", error);
    res.status(500).json({ message: "Failed to retrieve vendors" });
  }
});

// ─── GET /api/vendors/:id ─────────────────────────────────────────────────────
router.get("/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }
    res.json(vendor);
  } catch (error) {
    logger.error("[VendorRoutes] Failed to get vendor:", error);
    res.status(500).json({ message: "Failed to retrieve vendor" });
  }
});

// ─── POST /api/vendors ────────────────────────────────────────────────────────
router.post("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrgId(req);
    if (!organizationId) {
      res.status(400).json({ message: "Organization context required" });
      return;
    }

    const validated = createVendorSchema.parse(req.body);
    const payload: any = { ...validated, organizationId };
    if (validated.lastAssessmentDate) {
      payload.lastAssessmentDate = new Date(validated.lastAssessmentDate);
    }

    const vendor = await storage.createVendor(payload);
    await auditService.auditFromRequest(req, AuditAction.CREATE, "vendor", vendor.id);
    res.status(201).json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation failed", errors: error.errors });
      return;
    }
    logger.error("[VendorRoutes] Failed to create vendor:", error);
    res.status(500).json({ message: "Failed to create vendor" });
  }
});

// ─── PATCH /api/vendors/:id ───────────────────────────────────────────────────
router.patch("/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = updateVendorSchema.parse(req.body);
    const payload: any = { ...validated };
    if (validated.lastAssessmentDate) {
      payload.lastAssessmentDate = new Date(validated.lastAssessmentDate);
    }

    const vendor = await storage.updateVendor(req.params.id, payload);
    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }

    await auditService.auditFromRequest(req, AuditAction.UPDATE, "vendor", vendor.id);
    res.json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation failed", errors: error.errors });
      return;
    }
    logger.error("[VendorRoutes] Failed to update vendor:", error);
    res.status(500).json({ message: "Failed to update vendor" });
  }
});

// ─── DELETE /api/vendors/:id ──────────────────────────────────────────────────
router.delete("/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await storage.deleteVendor(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }
    await auditService.auditFromRequest(req, AuditAction.DELETE, "vendor", req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error("[VendorRoutes] Failed to delete vendor:", error);
    res.status(500).json({ message: "Failed to delete vendor" });
  }
});

// ─── GET /api/vendors/:id/questionnaires ──────────────────────────────────────
router.get("/:id/questionnaires", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaires = await storage.getVendorQuestionnaires(req.params.id);
    res.json(questionnaires);
  } catch (error) {
    logger.error("[VendorRoutes] Failed to list questionnaires:", error);
    res.status(500).json({ message: "Failed to retrieve vendor questionnaires" });
  }
});

// ─── POST /api/vendors/:id/questionnaires ─────────────────────────────────────
const createQuestionnaireSchema = z.object({
  sentAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  organizationId: z.string().optional(),
});

router.post("/:id/questionnaires", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrgId(req) || req.body.organizationId;
    if (!organizationId) {
      res.status(400).json({ message: "Organization context required" });
      return;
    }
    const validated = createQuestionnaireSchema.parse(req.body);
    const questionnaire = await storage.createVendorQuestionnaire({
      vendorId: req.params.id,
      organizationId,
      sentAt: validated.sentAt ? new Date(validated.sentAt) : null,
      dueAt: validated.dueAt ? new Date(validated.dueAt) : null,
    });
    res.status(201).json(questionnaire);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation failed", errors: error.errors });
      return;
    }
    logger.error("[VendorRoutes] Failed to create questionnaire:", error);
    res.status(500).json({ message: "Failed to create vendor questionnaire" });
  }
});

// ─── PATCH /api/vendors/questionnaires/:qId ───────────────────────────────────
router.patch("/questionnaires/:qId", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaire = await storage.updateVendorQuestionnaire(req.params.qId, req.body);
    if (!questionnaire) {
      res.status(404).json({ message: "Questionnaire not found" });
      return;
    }
    res.json(questionnaire);
  } catch (error) {
    logger.error("[VendorRoutes] Failed to update questionnaire:", error);
    res.status(500).json({ message: "Failed to update vendor questionnaire" });
  }
});

// ─── DELETE /api/vendors/questionnaires/:qId ──────────────────────────────────
router.delete("/questionnaires/:qId", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await storage.deleteVendorQuestionnaire(req.params.qId);
    if (!deleted) {
      res.status(404).json({ message: "Questionnaire not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    logger.error("[VendorRoutes] Failed to delete questionnaire:", error);
    res.status(500).json({ message: "Failed to delete vendor questionnaire" });
  }
});

export default router;
