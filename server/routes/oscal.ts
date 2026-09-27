/**
 * OSCAL 1.1 API Routes
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization, type MultiTenantRequest } from "../middleware/multiTenant";
import { secureHandler, ValidationError } from "../utils/errorHandling";
import { oscalService, type BuildOscalSspInput } from "../services/oscalService";

export function registerOscalRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/oscal/ssp/generate
   * Generates a complete OSCAL 1.1 System Security Plan
   */
  router.post(
    "/ssp/generate",
    isAuthenticated,
    requireOrganization,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const {
        systemName,
        systemShortName,
        description,
        securityLevel,
        framework,
        companyName,
        contactEmail,
        components,
        controls,
      } = req.body;

      if (!systemName || !description || !framework || !controls) {
        throw new ValidationError("Missing required fields: systemName, description, framework, and controls are required.");
      }

      const input: BuildOscalSspInput = {
        systemName,
        systemShortName,
        description,
        securityLevel,
        framework,
        companyName: companyName || req.organizationId || "Enterprise Organization",
        contactEmail,
        components,
        controls,
      };

      const oscalSsp = oscalService.generateSsp(input);
      const validation = oscalService.validateSsp(oscalSsp);

      res.status(201).json({
        success: true,
        data: {
          ssp: oscalSsp,
          validation,
        },
      });
    })
  );

  /**
   * POST /api/oscal/validate
   * Validates an arbitrary OSCAL JSON payload
   */
  router.post(
    "/validate",
    isAuthenticated,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const { ssp } = req.body;
      if (!ssp) {
        throw new ValidationError("Payload must contain 'ssp' object.");
      }

      const validation = oscalService.validateSsp(ssp);
      res.json({
        success: true,
        data: validation,
      });
    })
  );

  app.use("/api/oscal", router);
}
