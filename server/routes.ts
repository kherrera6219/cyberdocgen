import express, { Express, Router, Request, Response, NextFunction } from "express";
import "express-session";
import { createServer, type Server } from "http";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { auditService, AuditAction } from "./services/auditService";
import { logger } from "./utils/logger";
import { metricsCollector } from "./monitoring/metrics";
import { aiOrchestrator } from "./services/aiOrchestrator";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { extractOrganizationContext } from './middleware/multiTenant';
import { 
  healthCheckHandler, 
  readinessCheckHandler, 
  livenessCheckHandler 
} from "./utils/health";
import { 
  securityHeaders,
  csrfProtection,
  threatDetection,
  auditLogger,
  requireMFAForHighRisk,
  validateRequest,
  generalLimiter,
  authLimiter,
  aiLimiter
} from "./middleware/security";
import { tracingMiddleware } from "./middleware/tracing";
import { validateRouteAccess, logRoutePerformance } from "./middleware/routeValidation";
import { egressControlMiddleware } from "./middleware/egressControl";
import { isLocalMode, getRuntimeConfig } from "./config/runtime";
import { localAuthBypassMiddleware } from "./providers/auth/localBypass";

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
import { registerClientErrorRoutes } from "./routes/clientErrors";

export async function registerRoutes(app: Express): Promise<Server> {
  const isProduction = process.env.NODE_ENV === 'production';
  // Local desktop mode requires quick-access login (name/email) in packaged production builds.
  // In cloud mode, temp auth remains opt-in and non-production only.
  const enableTempAuth = isLocalMode() || (process.env.ENABLE_TEMP_AUTH === 'true' && !isProduction);

  // 1. Fundamental defensive and observability stack (Priority 1)
  app.use(securityHeaders);
  app.use(metricsCollector.requestMetrics());
  app.use(tracingMiddleware());
  app.use(cookieParser());
  app.use(generalLimiter);
  app.use(threatDetection);
  app.use(auditLogger);

  // 2. Base request processing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(validateRequest);

  // 3. Basic health checks
  app.get('/health', healthCheckHandler);
  app.get('/ready', readinessCheckHandler);
  app.get('/live', livenessCheckHandler);

  // 4. Performance and CORS
  if (isProduction) {
    app.use(compression());
  }
  
  // Configure secure CORS
  const corsOptions = {
    origin: isProduction 
      ? (process.env.ALLOWED_ORIGINS?.split(',') || [/\.replit\.dev$/, /\.repl\.co$/, /\.replit\.app$/])
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID']
  };
  app.use(cors(corsOptions));
  
  // 5. Session management (Must be before CSRF)
  app.use(getSession());
  
  // 6. Protection
  app.use(csrfProtection);

  // 6. Egress control and route validation
  app.use(egressControlMiddleware({ 
    strictMode: true, 
    logBlocked: true,
    bypassPaths: ['/api/webhooks']
  }));
  app.use(validateRouteAccess);
  app.use(logRoutePerformance);
  

  // 8. Authentication setup (Uses sessions)
  await setupAuth(app);
  
  // Force local auth bypass if in local mode (overrides passport)
  const localAuthBypassEnabled =
    isLocalMode() && process.env.LOCAL_AUTH_BYPASS?.toLowerCase() !== 'false';

  if (localAuthBypassEnabled) {
    logger.info("Enabling Local Auth Bypass Middleware");
    app.use(localAuthBypassMiddleware);
  } else if (isLocalMode()) {
    logger.info("Local Auth Bypass Middleware disabled (LOCAL_AUTH_BYPASS=false)");
  }

  // 9. High-risk operation protection
  app.use('/api', requireMFAForHighRisk);

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

  // Metrics endpoint for monitoring - protected by default
  // Only allow public access if ENABLE_PUBLIC_METRICS=true is explicitly set
  app.get("/metrics", async (req: Request, res) => {
    const allowPublicMetrics = process.env.ENABLE_PUBLIC_METRICS === 'true';
    
    if (!allowPublicMetrics) {
      // Check for authentication via session or API key
      const apiKey = req.headers['x-metrics-key'];
      const hasValidApiKey = process.env.METRICS_API_KEY && apiKey === process.env.METRICS_API_KEY;
      const isAuthenticated = req.isAuthenticated?.() || req.user;
      
      if (!isAuthenticated && !hasValidApiKey) {
        res.status(401).json({ error: "Unauthorized - metrics access requires authentication" });
        return;
      }
    }
    
    try {
      const metrics = metricsCollector.getMetrics();
      res.json(metrics);
    } catch {
      res.status(500).json({ error: "Failed to retrieve metrics" });
    }
  });

  // Public health check endpoint - must be before auth setup
  app.get("/api/ai/health", async (req: Request, res) => {
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
  // Configuration endpoint to allow frontend to detect deployment mode
  app.get("/api/config", (req: Request, res: Response) => {
    const runtime = getRuntimeConfig();
    res.json({
      deploymentMode: runtime.mode,
      isProduction: process.env.NODE_ENV === 'production',
      features: runtime.features,
      auth: {
        enabled: runtime.auth.enabled,
        provider: runtime.auth.provider,
      },
    });
  });

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

  // Multi-tenant context extraction - extracts organization context for authenticated users
  app.use('/api', extractOrganizationContext);

  // CSRF token endpoint - session-bound and user-bound for enhanced security
  app.get('/api/csrf-token', (req: Request, res) => {
    const session = req.session;
    if (!session) {
      res.status(500).json({ message: 'Session not available' });
      return;
    }
    
    // Get user ID for binding (from authenticated session or temp login)
    const userId = session.userId || req.user?.claims?.sub || req.user?.id || 'anonymous';
    
    // Regenerate CSRF token if user changed or token doesn't exist
    const shouldRegenerate = !session.csrfToken || 
                             !session.csrfUserId || 
                             session.csrfUserId !== userId;
    
    if (shouldRegenerate) {
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) {
        logger.error('CSRF token generation failed: SESSION_SECRET is not configured');
        res.status(500).json({ message: 'CSRF secret not configured' });
        return;
      }

      // Create user-bound CSRF token using HMAC for integrity
      const tokenData = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
      session.csrfToken = crypto.createHmac('sha256', sessionSecret)
        .update(tokenData)
        .digest('hex');
      session.csrfUserId = String(userId);
      session.csrfCreatedAt = Date.now();
      
      logger.info('CSRF token generated', { userId, sessionId: session.id?.slice(0, 8) });
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

  if (enableTempAuth) {
    logger.warn('Temporary authentication endpoints are enabled for non-production use');

    const sanitizeSlugSegment = (value: string): string => {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    };

    const ensureOrganizationMembership = async (
      userId: string,
      displayName: string,
      email: string
    ): Promise<string> => {
      const memberships = await storage.getUserOrganizations(userId);
      if (memberships.length > 0) {
        return memberships[0].organizationId;
      }

      const orgNameBase = displayName.trim() || email.split('@')[0] || 'User';
      const orgName = `${orgNameBase}'s Workspace`.slice(0, 120);
      const slugSeed = sanitizeSlugSegment(email.split('@')[0] || orgNameBase) || 'workspace';
      let lastError: unknown;

      for (let attempt = 0; attempt < 3; attempt++) {
        const slugSuffix = crypto.randomBytes(3).toString('hex');
        const slug = `demo-${slugSeed}-${slugSuffix}`.slice(0, 100);

        try {
          const organization = await storage.createOrganization({
            name: orgName,
            slug,
          });

          await storage.addUserToOrganization({
            userId,
            organizationId: organization.id,
            role: 'owner',
          });

          return organization.id;
        } catch (error: unknown) {
          lastError = error;

          // If membership was created by a concurrent request, use it.
          const refreshedMemberships = await storage.getUserOrganizations(userId);
          if (refreshedMemberships.length > 0) {
            return refreshedMemberships[0].organizationId;
          }
        }
      }

      throw lastError ?? new Error('Failed to provision organization for temporary user');
    };

    app.post('/api/auth/temp-login', authLimiter, async (req: Request, res) => {
      try {
        const { name, email } = req.body;

        if (!name || !email) {
          res.status(400).json({ message: 'Name and email are required' });
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.status(400).json({ message: 'Invalid email format' });
          return;
        }

        const sanitizedName = name.trim().slice(0, 100);
        const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);

        const existingUser = await storage.getUserByEmail(sanitizedEmail);
        let sessionUserId: string;

        if (existingUser) {
          sessionUserId = existingUser.id;
          logger.info('Temp login using existing user', { userId: sessionUserId, email: sanitizedEmail });
        } else {
          const tempUserId = `temp-${crypto.createHash('sha256').update(sanitizedEmail).digest('hex').slice(0, 16)}`;
          try {
            const createdUser = await storage.upsertUser({
              id: tempUserId,
              email: sanitizedEmail,
              firstName: sanitizedName.split(' ')[0] || sanitizedName,
              lastName: sanitizedName.split(' ').slice(1).join(' ') || '',
              profileImageUrl: null,
              lastLoginAt: new Date(),
            });
            sessionUserId = createdUser.id;
            logger.info('Temp login created persisted temp user', { userId: sessionUserId, email: sanitizedEmail });
          } catch (createError) {
            // Handle rare race where another request creates the same email in between reads.
            const racedUser = await storage.getUserByEmail(sanitizedEmail);
            if (racedUser) {
              sessionUserId = racedUser.id;
              logger.warn('Temp login recovered from concurrent user creation', {
                userId: sessionUserId,
                email: sanitizedEmail,
              });
            } else {
              throw createError;
            }
          }
        }

        const organizationId = await ensureOrganizationMembership(sessionUserId, sanitizedName, sanitizedEmail);

        await new Promise<void>((resolve, reject) => {
          req.session.regenerate((regenerateErr) => {
            if (regenerateErr) {
              reject(regenerateErr);
              return;
            }
            resolve();
          });
        });

        req.session.userId = sessionUserId;
        req.session.organizationId = organizationId;
        req.session.email = sanitizedEmail;
        req.session.isTemporary = true;
        req.session.tempUserName = sanitizedName;
        req.session.tempUserEmail = sanitizedEmail;
        req.session.loginTime = new Date().toISOString();
        req.session.mfaVerified = true;
        req.session.mfaVerifiedAt = new Date().toISOString() as any;

        await new Promise<void>((resolve, reject) => {
          req.session.save((saveErr) => {
            if (saveErr) {
              reject(saveErr);
              return;
            }
            resolve();
          });
        });

        logger.info('Temporary login successful with session regeneration', {
          userId: sessionUserId,
          organizationId,
          email: sanitizedEmail,
        });

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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Temporary login failed', { error, errorMessage });
        res.status(500).json({ message: 'Login failed', error: errorMessage });
      }
    });

    app.post('/api/auth/temp-logout', (req: Request, res) => {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Failed to destroy temp session', { error: err });
          res.status(500).json({ message: 'Logout failed' });
          return;
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  }

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
  app.post('/api/contact-messages', async (req: Request, res) => {
    try {
      const validated = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validated);
      logger.info("Contact message received", { email: validated.email, subject: validated.subject });
      res.status(201).json({ success: true, id: message.id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Contact form submission failed", { error: errorMessage });
      res.status(400).json({ message: "Failed to submit contact form", error: errorMessage });
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
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res) => {
    try {
      // Support both Replit OAuth and Enterprise auth with multiple fallbacks:
      // 1. req.user.claims.sub - Replit OAuth with full claims
      // 2. req.user.id - Replit OAuth with serialized user object
      // 3. req.session.userId - Enterprise email/password auth
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.userId;
      
      if (!userId) {
        res.status(401).json({ message: "User ID not found in session" });
        return;
      }
      
      // Include isTemporary flag for temp sessions
      const isTemporary = req.session?.isTemporary === true || String(userId).startsWith('temp-');

      const user = await storage.getUser(String(userId));

      if (!user) {
        if (isTemporary) {
          const tempDisplayName = req.session?.tempUserName || 'Temporary User';
          const [firstName, ...lastNameParts] = tempDisplayName.trim().split(/\s+/);
          const syntheticUser = {
            id: String(userId),
            email: req.session?.tempUserEmail || '',
            firstName: firstName || tempDisplayName,
            lastName: lastNameParts.join(' ') || '',
            profileImageUrl: null,
            role: 'user',
            isActive: true,
            createdAt: req.session?.loginTime || new Date().toISOString(),
            updatedAt: req.session?.loginTime || new Date().toISOString(),
          };

          res.json({
            ...syntheticUser,
            isTemporary: true,
            displayName: tempDisplayName,
          });
          return;
        }

        res.status(404).json({ message: "User not found" });
        return;
      }

      await auditService.auditFromRequest(
        req,
        AuditAction.READ,
        'user',
        String(userId)
      );

      res.json({
        ...user,
        isTemporary,
        displayName: isTemporary ? (req.session?.tempUserName || user.firstName) : (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error fetching user", { error: errorMessage, userId: req.user?.claims?.sub || req.user?.id || req.session?.userId }, req);
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

  const clientErrorsRouter = Router();
  registerClientErrorRoutes(clientErrorsRouter);
  app.use('/api/client-errors', clientErrorsRouter);

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
  // Backward compatibility alias for legacy clients/tests.
  app.use('/api/enterprise-auth', enterpriseAuthRoutes);

  // Microsoft Entra ID (OIDC/PKCE) Routes - Enterprise requirement from Spec-001
  const { default: microsoftAuthRoutes } = await import('./routes/microsoftAuth');
  app.use('/api/auth/microsoft', microsoftAuthRoutes);

  // MCP (Model Context Protocol) Routes - secured with authentication and organization context
  const { default: mcpRoutes } = await import('./mcp/server');
  app.use('/api/mcp', isAuthenticated, extractOrganizationContext, mcpRoutes);

  // Cloud Integration Routes
  const { default: cloudIntegrationRoutes } = await import('./routes/cloudIntegration');
  app.use('/api/cloud', cloudIntegrationRoutes);

  // Connectors Hub Routes
  const { connectorRouter } = await import('./routes/connectors');
  app.use('/api/connectors', connectorRouter);

  // Web Import Routes
  const { webImportRouter } = await import('./routes/web-import');
  app.use('/api/web-import', webImportRouter);

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

  // Repository Analysis Routes - NEW FEATURE
  const { default: repositoryRoutes } = await import('./routes/repository');
  app.use('/api/repository', repositoryRoutes);

  // Database Health Routes - Diagnostics & Monitoring
  const { default: healthRoutes } = await import('./routes/health');
  app.use('/api/health', healthRoutes);

  // Local Mode Routes - Desktop Integration (Sprint 2)
  const { default: localModeRoutes } = await import('./routes/localMode');
  app.use('/api/local', localModeRoutes);

  // Global Error Handler (Must be last)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error
    if (status >= 500) {
      logger.error('Unhandled Server Error', { error: message, stack: err.stack, path: req.path });
    } else {
      logger.warn('Client Error', { error: message, status, path: req.path });
    }

    // Return JSON response
    res.status(status).json({ message });
  });

  const httpServer = createServer(app);
  return httpServer;
}
