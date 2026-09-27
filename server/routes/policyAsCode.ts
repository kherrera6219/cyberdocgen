/**
 * Policy-as-Code API Routes
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization, type MultiTenantRequest } from "../middleware/multiTenant";
import { secureHandler, ValidationError } from "../utils/errorHandling";
import { policyAsCodeService, type PolicyRuleStatement } from "../services/policyAsCodeService";

export function registerPolicyAsCodeRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/policy-as-code/synthesize
   * Synthesize OPA Rego rules and Terraform Tests from policy statements
   */
  router.post(
    "/synthesize",
    isAuthenticated,
    requireOrganization,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const { framework, packageName, statements } = req.body;

      if (!framework || !packageName || !statements || !Array.isArray(statements)) {
        throw new ValidationError("Missing required parameters: framework, packageName, and statements array.");
      }

      const bundle = policyAsCodeService.synthesizeBundle(
        framework,
        packageName,
        statements as PolicyRuleStatement[]
      );

      res.status(201).json({
        success: true,
        data: bundle,
      });
    })
  );

  app.use("/api/policy-as-code", router);
}
