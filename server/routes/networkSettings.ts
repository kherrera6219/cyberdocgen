import { Router, Response, NextFunction } from 'express';
import { networkSettingsManager } from '../config/networkSettings';
import { diagnosticsService } from '../services/diagnosticsService';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { secureHandler } from '../utils/errorHandling';
import { auditService, AuditAction } from '../services/auditService';
import { type MultiTenantRequest } from '../middleware/multiTenant';
import fs from 'fs';
import path from 'path';

export function registerNetworkSettingsRoutes(router: Router) {
  /**
   * Get current host network and SSL configurations
   */
  router.get("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const settings = networkSettingsManager.getSettings();
    
    res.json({
      success: true,
      data: {
        host: settings.host,
        port: settings.port,
        sslEnabled: settings.sslEnabled,
        hasCert: !!settings.sslCertPath && fs.existsSync(settings.sslCertPath),
        hasKey: !!settings.sslKeyPath && fs.existsSync(settings.sslKeyPath)
      }
    });
  }));

  /**
   * Update host network configurations or upload certificates
   */
  router.post("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { host, port, sslEnabled, certPem, keyPem } = req.body;

    let updated = networkSettingsManager.getSettings();

    // Handle SSL Certificate upload if provided
    if (certPem && keyPem) {
      const sslResult = networkSettingsManager.saveSSLCertificate(certPem, keyPem);
      if (!sslResult.success) {
        res.status(500).json({ success: false, message: "Failed to save SSL credentials" });
        return;
      }
    }

    // Save host bindings or ports
    updated = networkSettingsManager.saveSettings({
      host,
      port: port ? parseInt(port, 10) : undefined,
      sslEnabled: sslEnabled !== undefined ? !!sslEnabled : undefined
    });

    // Log GRC operational audit event
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'network_settings',
      entityId: 'host_bindings',
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'network_settings_update',
        host: updated.host,
        port: updated.port,
        sslEnabled: updated.sslEnabled
      }
    });

    res.json({
      success: true,
      message: "Network configurations saved successfully. A server reboot may be required to bind new ports.",
      data: {
        host: updated.host,
        port: updated.port,
        sslEnabled: updated.sslEnabled,
        hasCert: !!updated.sslCertPath && fs.existsSync(updated.sslCertPath)
      }
    });
  }));

  /**
   * 1-Click diagnostic bundler package generation and download
   */
  router.post("/diagnostics/bundle", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const result = await diagnosticsService.generateDiagnosticBundle(organizationId);

    if (!result.success || !result.filePath) {
      res.status(500).json({ success: false, message: result.error || "Failed to generate bundle" });
      return;
    }

    // Log GRC audit event
    await auditService.logAction({
      action: AuditAction.READ,
      entityType: 'diagnostics',
      entityId: result.filename || 'bundle',
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'diagnostics_bundle_generation',
        filename: result.filename
      }
    });

    res.json({
      success: true,
      message: "Diagnostics compiled successfully.",
      filename: result.filename,
      filePath: result.filePath
    });
  }));

  /**
   * Dynamic file download for generated diagnostic packages
   */
  router.get("/diagnostics/download/:filename", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const filename = req.params.filename;

    // Direct path safety check to prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      res.status(400).json({ success: false, message: "Invalid filename request" });
      return;
    }

    const baseDir = process.env.LOCAL_DATA_PATH 
      ? path.resolve(process.env.LOCAL_DATA_PATH, 'diagnostics')
      : path.resolve(process.cwd(), 'data/diagnostics');

    const filePath = path.join(baseDir, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "Diagnostic file not found" });
      return;
    }

    // Enforce filename organization constraint
    if (!filename.includes(organizationId)) {
      res.status(403).json({ success: false, message: "Unauthorized access to requested diagnostic bundle" });
      return;
    }

    res.download(filePath, filename);
  }));
}
