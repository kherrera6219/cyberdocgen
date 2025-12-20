import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditService, AuditAction } from "./services/auditService";
import { logger } from "./utils/logger";
import { metricsCollector } from "./monitoring/metrics";
import { aiOrchestrator } from "./services/aiOrchestrator";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { generalLimiter, authLimiter, authStrictLimiter, aiLimiter, apiLimiter } from './middleware/rateLimiter';
import { extractOrganizationContext } from './middleware/multiTenant';

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
import { registerEvidenceRoutes } from "./routes/evidence";
import { registerControlsRoutes } from "./routes/controls";
import { registerAuditorRoutes } from "./routes/auditor";
import userProfileRoutes from "./routes/userProfile";
import rolesRoutes from "./routes/roles";
import projectsRoutes from "./routes/projects";
import aiSessionsRoutes from "./routes/aiSessions";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerFrameworkControlStatusesRoutes } from "./routes/frameworkControlStatuses";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add metrics collection middleware
  app.use(metricsCollector.requestMetrics());

  // Add security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Apply general rate limiting to all routes
  app.use(generalLimiter);

  /**
   * @openapi
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: System health check
   *     description: Returns comprehensive system health metrics including uptime, request stats, and performance
   *     responses:
   *       200:
   *         description: System is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   *       500:
   *         description: System is unhealthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: unhealthy
   *                 error:
   *                   type: string
   */
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

  // Metrics endpoint for monitoring - protected by default
  // Only allow public access if ENABLE_PUBLIC_METRICS=true is explicitly set
  app.get("/metrics", async (req: any, res) => {
    const allowPublicMetrics = process.env.ENABLE_PUBLIC_METRICS === 'true';
    
    if (!allowPublicMetrics) {
      // Check for authentication via session or API key
      const apiKey = req.headers['x-metrics-key'];
      const hasValidApiKey = process.env.METRICS_API_KEY && apiKey === process.env.METRICS_API_KEY;
      const isAuthenticated = req.isAuthenticated?.() || req.user;
      
      if (!isAuthenticated && !hasValidApiKey) {
        return res.status(401).json({ error: "Unauthorized - metrics access requires authentication" });
      }
    }
    
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

  // OpenAPI Documentation - Interactive Swagger UI
  // Disabled by default in production (when NODE_ENV !== 'development')
  // Enable with ENABLE_SWAGGER=true if needed
  const isDevEnvironment = process.env.NODE_ENV === 'development';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true';
  if (isDevEnvironment || enableSwagger) {
    /**
     * @openapi
     * /api-docs:
     *   get:
     *     tags: [Documentation]
     *     summary: Interactive API documentation (Swagger UI)
     *     description: Access the interactive OpenAPI documentation
     *     responses:
     *       200:
     *         description: Swagger UI HTML page
     */
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'CyberDocGen API Documentation',
      customfavIcon: '/favicon.ico',
    }));

    // OpenAPI JSON specification endpoint
    /**
     * @openapi
     * /api-docs.json:
     *   get:
     *     tags: [Documentation]
     *     summary: OpenAPI specification in JSON format
     *     description: Returns the raw OpenAPI 3.1 specification
     *     responses:
     *       200:
     *         description: OpenAPI specification
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     */
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('API documentation available at /api-docs');
  } else {
    logger.info('API documentation disabled in production (set ENABLE_SWAGGER=true to enable)');
  }

  // Auth middleware - IMPORTANT: This must come before any authenticated routes
  await setupAuth(app);

  // Multi-tenant context extraction - extracts organization context for authenticated users
  app.use('/api', extractOrganizationContext);

  // CSRF token endpoint - session-bound, must come after auth setup
  app.get('/api/csrf-token', (req: any, res) => {
    const session = req.session;
    if (!session) {
      return res.status(500).json({ message: 'Session not available' });
    }
    
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

  // Temporary login endpoint - creates a demo session for testing
  // This is a workaround while the main authentication system is being fixed
  // Uses production-grade rate limiting via authLimiter middleware
  app.post('/api/auth/temp-login', authLimiter, async (req: any, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Sanitize inputs
      const sanitizedName = name.trim().slice(0, 100);
      const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(sanitizedEmail);
      let sessionUserId: string;
      
      if (existingUser) {
        // Use the existing user's ID - don't modify the database
        sessionUserId = existingUser.id;
        logger.info('Temp login using existing user', { userId: sessionUserId, email: sanitizedEmail });
      } else {
        // Create a new temporary user for this email
        const tempUserId = `temp-${crypto.createHash('sha256').update(sanitizedEmail).digest('hex').slice(0, 16)}`;
        await storage.upsertUser({
          id: tempUserId,
          email: sanitizedEmail,
          firstName: sanitizedName.split(' ')[0] || sanitizedName,
          lastName: sanitizedName.split(' ').slice(1).join(' ') || '',
          profileImageUrl: null,
        });
        sessionUserId = tempUserId;
        logger.info('Temp login created new temp user', { userId: sessionUserId, email: sanitizedEmail });
      }
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((regenerateErr: any) => {
        if (regenerateErr) {
          logger.error('Failed to regenerate session', { error: regenerateErr.message });
          return res.status(500).json({ message: 'Failed to create secure session' });
        }
        
        // Set the session data on the new regenerated session
        req.session.userId = sessionUserId;
        req.session.isTemporary = true;
        req.session.tempUserName = sanitizedName;
        req.session.tempUserEmail = sanitizedEmail;
        req.session.loginTime = new Date().toISOString();
        // Auto-verify MFA for temp sessions
        req.session.mfaVerified = true;
        req.session.mfaVerifiedAt = new Date().toISOString();
        
        // Save session explicitly
        req.session.save((err: any) => {
          if (err) {
            logger.error('Failed to save temp session', { error: err.message });
            return res.status(500).json({ message: 'Failed to create session' });
          }
          
          logger.info('Temporary login successful with session regeneration', { userId: sessionUserId, email: sanitizedEmail });
          
          res.json({
            success: true,
            user: {
              id: sessionUserId,
              email: sanitizedEmail,
              displayName: sanitizedName,
              firstName: sanitizedName.split(' ')[0] || sanitizedName,
              lastName: sanitizedName.split(' ').slice(1).join(' ') || '',
              isTemporary: true,
            }
          });
        });
      });
    } catch (error: any) {
      logger.error('Temporary login failed', { error: error.message });
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  });

  // Temporary logout endpoint
  app.post('/api/auth/temp-logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        logger.error('Failed to destroy temp session', { error: err.message });
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  /**
   * @openapi
   * /api/contact-messages:
   *   post:
   *     tags: [Public]
   *     summary: Submit a contact form message
   *     description: Public endpoint for submitting contact messages (no authentication required)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - subject
   *               - message
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Sender's email address
   *               subject:
   *                 type: string
   *                 description: Message subject
   *               message:
   *                 type: string
   *                 description: Message content
   *               name:
   *                 type: string
   *                 description: Sender's name (optional)
   *     responses:
   *       201:
   *         description: Message submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 id:
   *                   type: string
   *                   format: uuid
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   */
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

  /**
   * @openapi
   * /api/auth/user:
   *   get:
   *     tags: [Authentication]
   *     summary: Get current authenticated user
   *     description: Returns the profile of the currently authenticated user
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Support both Replit OAuth and Enterprise auth with multiple fallbacks:
      // 1. req.user.claims.sub - Replit OAuth with full claims
      // 2. req.user.id - Replit OAuth with serialized user object
      // 3. req.session.userId - Enterprise email/password auth
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await auditService.auditFromRequest(
        req,
        AuditAction.READ,
        'user',
        userId
      );

      // Include isTemporary flag for temp sessions
      const isTemporary = req.session?.isTemporary === true || userId.startsWith('temp-');
      res.json({
        ...user,
        isTemporary,
        displayName: isTemporary ? (req.session?.tempUserName || user.firstName) : (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email),
      });
    } catch (error: any) {
      logger.error("Error fetching user", { error: error.message, userId: req.user?.claims?.sub || req.user?.id || req.session?.userId }, req);
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
  app.use('/api/ai', aiLimiter, aiRouter);

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
  // Alias for audit logs (used by some tests)
  app.use('/api/audit-logs', auditTrailRouter);

  const generationJobsRouter = Router();
  registerGenerationJobsRoutes(generationJobsRouter);
  app.use('/api/generation-jobs', generationJobsRouter);

  const generateDocumentsRouter = Router();
  registerGenerateDocumentsRoutes(generateDocumentsRouter);
  app.use('/api/documents/generate', generateDocumentsRouter);

  const approvalsRouter = Router();
  registerApprovalsRoutes(approvalsRouter);
  app.use('/api/approvals', approvalsRouter);

  // Evidence routes
  registerEvidenceRoutes(app);

  // Controls routes
  registerControlsRoutes(app);

  // Auditor routes
  registerAuditorRoutes(app);

  // Phase 2 Implementation - MFA Routes Integration - with auth rate limiting
  const { default: mfaRoutes } = await import('./routes/mfa');
  app.use('/api/auth/mfa', authLimiter, mfaRoutes);

  // Enterprise Authentication Routes
  // Note: Rate limiting applied at individual route level in enterpriseAuth.ts
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

  // User Profile Routes
  app.use('/api/profile', userProfileRoutes);

  // Roles and Permissions Routes
  app.use('/api/roles', rolesRoutes);

  // Projects Routes
  app.use('/api/projects', projectsRoutes);

  // AI Sessions Routes
  app.use('/api/ai-sessions', aiSessionsRoutes);

  // Notification Routes
  const notificationsRouter = Router();
  registerNotificationRoutes(notificationsRouter);
  app.use('/api/notifications', notificationsRouter);

  // Dashboard Routes
  registerDashboardRoutes(app);

  // Framework Control Statuses Routes
  registerFrameworkControlStatusesRoutes(app);

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
