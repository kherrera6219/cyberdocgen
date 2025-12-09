import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditService, AuditAction } from "./services/auditService";
import { logger } from "./utils/logger";
import { metricsCollector } from "./monitoring/metrics";
import { aiOrchestrator } from "./services/aiOrchestrator";

import { insertContactMessageSchema } from "@shared/schema";
import { registerOrganizationsRoutes } from "./routes/organizations";
import { registerCompanyProfilesRoutes } from "./routes/companyProfiles";
import { registerDocumentsRoutes } from "./routes/documents";
import { registerAIRoutes } from "./routes/ai";
import { registerStorageRoutes } from "./routes/storage";
import { registerGapAnalysisRoutes } from "./routes/gapAnalysis";
import { registerTemplatesRoutes, registerFrameworksRoutes } from "./routes/templates";
import { registerExportRoutes } from "./routes/export";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerAuditTrailRoutes } from "./routes/auditTrail";
import { registerGenerationJobsRoutes, registerGenerateDocumentsRoutes } from "./routes/generationJobs";
import { registerApprovalsRoutes } from "./routes/approvals";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add metrics collection middleware
  app.use(metricsCollector.requestMetrics());

  // System health endpoint with comprehensive metrics
  app.get("/health", async (req, res) => {
    try {
      const metrics = metricsCollector.getMetrics();
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: metrics.uptime,
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        metrics: {
          requests: metrics.requests.total,
          avgResponseTime: metrics.computedMetrics.avgResponseTime,
          errorRate: metrics.computedMetrics.errorRate
        }
      };
      res.json(healthStatus);
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: "Health check failed" });
    }
  });

  // Metrics endpoint for monitoring
  app.get("/metrics", async (req, res) => {
    try {
      const metrics = metricsCollector.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve metrics" });
    }
  });

  // Public health check endpoint - must be before auth setup
  app.get("/api/ai/health", async (req: any, res) => {
    try {
      const health = await aiOrchestrator.healthCheck();
      res.json(health);
    } catch (error: unknown) {
      metricsCollector.trackAIOperation('analysis', false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("AI Health check failed", { error: errorMessage });
      res.status(500).json({ message: "Health check failed", error: errorMessage });
    }
  });

  // Auth middleware - IMPORTANT: This must come before any authenticated routes
  await setupAuth(app);

  // CSRF token endpoint - session-bound, must come after auth setup
  app.get('/api/csrf-token', (req: any, res) => {
    const session = req.session;
    if (!session) {
      return res.status(500).json({ message: 'Session not available' });
    }
    
    const crypto = require('crypto');
    if (!session.csrfToken) {
      session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    
    res.cookie('csrf-token', session.csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ csrfToken: session.csrfToken });
  });

  // Ensure all API routes have proper CORS and validation
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL || 'https://your-domain.com' : '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Public contact form endpoint (no auth required)
  app.post('/api/contact-messages', async (req: any, res) => {
    try {
      const validated = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validated);
      logger.info("Contact message received", { email: validated.email, subject: validated.subject });
      res.status(201).json({ success: true, id: message.id });
    } catch (error: any) {
      logger.error("Contact form submission failed", { error: error.message });
      res.status(400).json({ message: "Failed to submit contact form", error: error.message });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      await auditService.auditFromRequest(
        req,
        AuditAction.READ,
        'user',
        userId
      );
      
      res.json(user);
    } catch (error: any) {
      logger.error("Error fetching user", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mount modular routers
  const organizationsRouter = Router();
  registerOrganizationsRoutes(organizationsRouter);
  app.use('/api/organizations', organizationsRouter);

  const companyProfilesRouter = Router();
  await registerCompanyProfilesRoutes(companyProfilesRouter);
  app.use('/api/company-profiles', companyProfilesRouter);

  const documentsRouter = Router();
  await registerDocumentsRoutes(documentsRouter);
  app.use('/api/documents', documentsRouter);

  const aiRouter = Router();
  await registerAIRoutes(aiRouter);
  app.use('/api/ai', aiRouter);

  const storageRouter = Router();
  registerStorageRoutes(storageRouter);
  app.use('/api/storage', storageRouter);

  const gapAnalysisRouter = Router();
  await registerGapAnalysisRoutes(gapAnalysisRouter);
  app.use('/api/gap-analysis', gapAnalysisRouter);

  const templatesRouter = Router();
  registerTemplatesRoutes(templatesRouter);
  app.use('/api/document-templates', templatesRouter);

  const frameworksRouter = Router();
  await registerFrameworksRoutes(frameworksRouter);
  app.use('/api/frameworks', frameworksRouter);

  const exportRouter = Router();
  await registerExportRoutes(exportRouter);
  app.use('/api', exportRouter);

  const analyticsRouter = Router();
  await registerAnalyticsRoutes(analyticsRouter);
  app.use('/api', analyticsRouter);

  const auditTrailRouter = Router();
  registerAuditTrailRoutes(auditTrailRouter);
  app.use('/api/audit-trail', auditTrailRouter);

  const generationJobsRouter = Router();
  registerGenerationJobsRoutes(generationJobsRouter);
  app.use('/api/generation-jobs', generationJobsRouter);

  const generateDocumentsRouter = Router();
  registerGenerateDocumentsRoutes(generateDocumentsRouter);
  app.use('/api/documents/generate', generateDocumentsRouter);

  const approvalsRouter = Router();
  registerApprovalsRoutes(approvalsRouter);
  app.use('/api/approvals', approvalsRouter);

  // Phase 2 Implementation - MFA Routes Integration
  const { default: mfaRoutes } = await import('./routes/mfa');
  app.use('/api/auth/mfa', mfaRoutes);

  // Enterprise Authentication Routes
  const { default: enterpriseAuthRoutes } = await import('./routes/enterpriseAuth');
  app.use('/api/auth/enterprise', enterpriseAuthRoutes);

  // MCP (Model Context Protocol) Routes
  const { default: mcpRoutes } = await import('./mcp/server');
  app.use('/api/mcp', isAuthenticated, mcpRoutes);

  // Cloud Integration Routes
  const { default: cloudIntegrationRoutes } = await import('./routes/cloudIntegration');
  app.use('/api/cloud', cloudIntegrationRoutes);

  // Admin Routes
  const { default: adminRoutes } = await import('./routes/admin');
  app.use('/api/admin', adminRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function for content types
function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'html': 'text/html'
  };
  return contentTypes[format.toLowerCase()] || 'text/plain';
}
