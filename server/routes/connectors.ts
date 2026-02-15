import { Router } from "express";
import { connectorService } from "../services/connectorService";
import { z } from "zod";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization } from "../middleware/multiTenant";
import {
  connectorImportLimiter,
  connectorReadLimiter,
  connectorWriteLimiter,
} from "../middleware/rateLimiter";

export const connectorRouter = Router();
const connectorTypeSchema = z.enum(["sharepoint", "jira", "notion"] as const);

const createConnectorRequestSchema = z.object({
  integrationId: z.string().min(1, "integrationId is required"),
  name: z.string().min(1, "name is required"),
  connectorType: connectorTypeSchema,
  scopeConfig: z.record(z.string(), z.unknown()),
});

const runImportRequestSchema = z.object({
  snapshotId: z.string().min(1, "snapshotId is required"),
});

function getRequestContext(req: any): { userId?: string; organizationId?: string } {
  const session = req.session;

  return {
    userId: req.user?.id || session?.user?.id,
    organizationId:
      req.organizationId ||
      session?.user?.organizationId ||
      req.user?.organizationId ||
      session?.organizationId,
  };
}

// Middleware to ensure user is authenticated
connectorRouter.use(isAuthenticated);
connectorRouter.use(requireOrganization);

// Get all connectors for the current organization
connectorRouter.get("/", connectorReadLimiter, async (req, res) => {
  try {
    const { organizationId } = getRequestContext(req);

    if (!organizationId) {
      return res.status(400).json({ message: "Organization context required" });
    }

    const configs = await connectorService.getConfigs(organizationId);
    res.json({ data: configs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new connector configuration
connectorRouter.post("/", connectorWriteLimiter, async (req, res) => {
  try {
    const validatedData = createConnectorRequestSchema.parse(req.body);
    const { userId, organizationId } = getRequestContext(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!organizationId) {
      return res.status(400).json({ message: "Organization context required" });
    }

    const config = await connectorService.createConfig(
      userId,
      organizationId,
      validatedData.integrationId,
      validatedData.name,
      validatedData.connectorType,
      validatedData.scopeConfig,
      req.ip || 'unknown'
    );
    res.status(201).json({ data: config });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    res.status(500).json({ message: error.message });
  }
});

// Trigger an import (Run Snapshot)
connectorRouter.post("/:id/import", connectorImportLimiter, async (req, res) => {
  try {
    const configId = req.params.id;
    const { snapshotId } = runImportRequestSchema.parse(req.body);
    const { userId, organizationId } = getRequestContext(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!organizationId) {
      return res.status(400).json({ message: "Organization context required" });
    }

    await connectorService.runImport(
      userId,
      organizationId,
      configId,
      snapshotId,
      req.ip || "unknown",
    );

    res.json({ message: "Import completed successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    res.status(500).json({ message: error.message });
  }
});
