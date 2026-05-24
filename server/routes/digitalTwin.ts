import { Router, Response } from "express";
import { isAuthenticated, getRequiredUserId } from "../replitAuth";
import { digitalTwinService } from "../services/digitalTwinService";
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

export function registerDigitalTwinRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/digital-twin/start
   * Spin up a new AI digital twin mock audit simulation session
   */
  router.post("/start", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);
    const { framework, auditorPersonality = "strict" } = req.body;

    if (!framework) {
      throw new ValidationError("Framework parameter is required (e.g. 'SOC2', 'ISO27001')");
    }

    // Create pending mock audit run record
    const audit = await storage.createMockAudit({
      organizationId,
      framework,
      auditorPersonality,
      status: "pending",
      transcript: [],
      createdBy: userId
    });

    // Fire and forget run simulation in background
    digitalTwinService.runSimulation(audit.id, organizationId, userId).catch(err => {
      logger.error("[DigitalTwinRoutes] Simulation execution worker crashed:", err);
    });

    res.status(202).json({ 
      success: true, 
      message: "AI digital twin audit simulation queued in background.", 
      data: audit 
    });
  }));

  /**
   * GET /api/digital-twin/status/:id
   * Poll status, transcript stream, and final report of an audit run
   */
  router.get("/status/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const audit = await storage.getMockAudit(id);
    if (!audit || audit.organizationId !== organizationId) {
      throw new NotFoundError("Mock audit run session not found");
    }

    res.json({ success: true, data: audit });
  }));

  /**
   * GET /api/digital-twin/history
   * Retrieve list of past digital twin mock audits
   */
  router.get("/history", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const history = await storage.getMockAudits(organizationId);
    res.json({ success: true, data: history });
  }));

  app.use("/api/digital-twin", router);
}
