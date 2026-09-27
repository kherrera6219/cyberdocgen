/**
 * Living SSP & IaC Drift Detection API Routes
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization, type MultiTenantRequest } from "../middleware/multiTenant";
import { secureHandler, ValidationError } from "../utils/errorHandling";
import { iacDriftService, type ParsedCloudResource } from "../services/iacDriftService";

export function registerDriftRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/drift/analyze
   * Analyzes uploaded Terraform state or HCL against documented control claims
   */
  router.post(
    "/analyze",
    isAuthenticated,
    requireOrganization,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const { terraformState, terraformHcl, controlStatements } = req.body;

      if (!terraformState && !terraformHcl) {
        throw new ValidationError("Must provide either 'terraformState' (JSON) or 'terraformHcl' string.");
      }

      if (!controlStatements || !Array.isArray(controlStatements)) {
        throw new ValidationError("'controlStatements' array is required.");
      }

      let resources: ParsedCloudResource[] = [];
      if (terraformState) {
        const stateStr = typeof terraformState === "string" ? terraformState : JSON.stringify(terraformState);
        resources = iacDriftService.parseTerraformState(stateStr);
      } else if (terraformHcl) {
        resources = iacDriftService.parseTerraformHcl(terraformHcl);
      }

      const report = iacDriftService.analyzeDrift(resources, controlStatements);

      res.json({
        success: true,
        data: report,
      });
    })
  );

  app.use("/api/drift", router);
}
