import { Router } from "express";
import { connectorService } from "../services/connectorService";
import { insertConnectorConfigSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization } from "../middleware/multiTenant";

export const connectorRouter = Router();

// Middleware to ensure user is authenticated
connectorRouter.use(isAuthenticated);
connectorRouter.use(requireOrganization);

// Get all connectors for the current organization
connectorRouter.get("/", async (req, res) => {
  try {
    const session = req.session as any;
    // Fallback if session structure varies (adjust based on actual auth middleware)
    const targetOrgId = (req.query.organizationId as string) || session?.user?.organizationId || (req.user as any)?.organizationId || session?.organizationId;
    
    if (!targetOrgId) return res.status(400).json({ message: "Organization context required" });

    const configs = await connectorService.getConfigs(targetOrgId);
    res.json({ data: configs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new connector configuration
connectorRouter.post("/", async (req, res) => {
  try {
    // Validate body
    const validatedData = insertConnectorConfigSchema.parse(req.body);
    const userId = (req.user as any)?.id || (req.session as any)?.user?.id;
    // user/org context
    const targetOrgId = validatedData.organizationId; 

    // Basic permission check (assuming standard user can create, or add admin check)
    
    const config = await connectorService.createConfig(
      userId,
      targetOrgId,
      validatedData.integrationId,
      validatedData.name,
      validatedData.connectorType as any,
      validatedData.scopeConfig,
      req.ip || 'unknown'
    );
    res.status(201).json({ data: config });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

// Trigger an import (Run Snapshot)
connectorRouter.post("/:id/import", async (req, res) => {
    try {
        const configId = req.params.id;
        const snapshotId = req.body.snapshotId; // Optional: Add to specific snapshot
        const userId = (req.user as any)?.id || (req.session as any)?.user?.id;

        // Run async
        await connectorService.runImport(userId, configId, snapshotId, req.ip || 'unknown');

        res.json({ message: "Import completed successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});
