/**
 * LDAP / Active Directory Authentication Settings Routes
 * Allows on-premises admins to configure LDAP server connection details
 * stored in the local PGlite system config table.
 */
import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { systemConfigService } from "../services/systemConfigService";
import { ldapAuthService } from "../services/ldapAuthService";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = Router();

const ldapConfigSchema = z.object({
  enabled: z.boolean(),
  url: z.string().min(1).max(500),          // e.g. ldap://corp.example.com:389
  baseDn: z.string().min(1).max(500),       // e.g. DC=corp,DC=example,DC=com
  bindDn: z.string().min(1).max(500),       // e.g. CN=svc-grc,OU=Services,DC=corp,DC=example,DC=com
  bindPassword: z.string().max(500),
  userSearchFilter: z.string().max(500).optional().default("(sAMAccountName={{username}})"),
  groupSearchBase: z.string().max(500).optional().nullable(),
  groupSearchFilter: z.string().max(500).optional().nullable(),
  tlsEnabled: z.boolean().optional().default(false),
  tlsCaCert: z.string().max(10000).optional().nullable(),
  syncInterval: z.number().int().min(60).max(86400).optional().default(3600),
});

// ─── GET /api/admin/ldap ──────────────────────────────────────────────────────
router.get("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await systemConfigService.get("ldap");
    if (!config) {
      res.json({ configured: false });
      return;
    }
    // Redact the bind password before returning to client
    const safe = { ...config, bindPassword: config.bindPassword ? "***REDACTED***" : "" };
    res.json({ configured: true, ...safe });
  } catch (error) {
    logger.error("[LDAPRoutes] Failed to get LDAP config:", error);
    res.status(500).json({ message: "Failed to retrieve LDAP configuration" });
  }
});

// ─── POST /api/admin/ldap ─────────────────────────────────────────────────────
router.post("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = ldapConfigSchema.parse(req.body);
    await systemConfigService.set("ldap", validated);
    logger.info("[LDAPRoutes] LDAP configuration saved");
    res.json({ success: true, message: "LDAP configuration saved" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation failed", errors: error.errors });
      return;
    }
    logger.error("[LDAPRoutes] Failed to save LDAP config:", error);
    res.status(500).json({ message: "Failed to save LDAP configuration" });
  }
});

// ─── POST /api/admin/ldap/test ────────────────────────────────────────────────
router.post("/test", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await ldapAuthService.testConnection();
    res.json(result);
  } catch (error) {
    logger.error("[LDAPRoutes] LDAP connection test failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    });
  }
});

// ─── DELETE /api/admin/ldap ───────────────────────────────────────────────────
router.delete("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    await systemConfigService.delete("ldap");
    res.json({ success: true, message: "LDAP configuration removed" });
  } catch (error) {
    logger.error("[LDAPRoutes] Failed to delete LDAP config:", error);
    res.status(500).json({ message: "Failed to remove LDAP configuration" });
  }
});

export default router;
