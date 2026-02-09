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
    const targetOrgId = (req as any).organizationId || session?.user?.organizationId || (req.user as any)?.organizationId || session?.organizationId;
    
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
    const targetOrgId = (req as any).organizationId || (req.user as any)?.organizationId || (req.session as any)?.organizationId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!targetOrgId) {
      return res.status(400).json({ message: "Organization context required" });
    }
    // Basic permission check (assuming standard user can create, or add admin check)
    
    const config = await connectorService.createConfig(
      userId,
      targetOrgId,
      validatedData.integrationId,
      validatedData.name,
      validatedData.connectorType,
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
        const targetOrgId = (req as any).organizationId || (req.user as any)?.organizationId || (req.session as any)?.organizationId;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!targetOrgId) {
            return res.status(400).json({ message: "Organization context required" });
        }

        // Run async
        await connectorService.runImport(userId, targetOrgId, configId, snapshotId, req.ip || 'unknown');

        res.json({ message: "Import completed successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});
