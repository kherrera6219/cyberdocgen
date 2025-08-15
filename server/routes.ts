import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditService } from "./services/auditService";
import { versionService } from "./services/versionService";
import { logger } from "./utils/logger";
import { validateRequest, commonSchemas } from "./utils/validation";
import { insertCompanyProfileSchema, insertDocumentSchema, insertGenerationJobSchema } from "@shared/schema";
import { generateComplianceDocuments, frameworkTemplates } from "./services/openai";
import { aiOrchestrator, type AIModel, type GenerationOptions } from "./services/aiOrchestrator";
import { documentAnalysisService } from "./services/documentAnalysis";
import { complianceChatbot } from "./services/chatbot";
import { riskAssessmentService } from "./services/riskAssessment";
import { qualityScoringService } from "./services/qualityScoring";
import { generationLimiter } from "./middleware/security";
import { z } from "zod";
import { metricsCollector } from "./monitoring/metrics";
import { objectStorageService } from "./services/objectStorageService";

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

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Log user access for audit trail
      await auditService.logAction({
        action: "view",
        entityType: "user",
        entityId: userId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(user);
    } catch (error: any) {
      logger.error("Error fetching user", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.get("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userOrganizations = await storage.getUserOrganizations(userId);
      const organizations = [];
      
      for (const userOrg of userOrganizations) {
        const org = await storage.getOrganization(userOrg.organizationId);
        if (org) {
          organizations.push({ ...org, role: userOrg.role });
        }
      }
      
      res.json(organizations);
    } catch (error) {
      logger.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationData = req.body;
      
      // Create organization
      const organization = await storage.createOrganization(organizationData);
      
      // Add user as owner
      await storage.addUserToOrganization({
        userId,
        organizationId: organization.id,
        role: "owner",
      });
      
      res.status(201).json(organization);
    } catch (error) {
      logger.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Company Profile routes
  app.get("/api/company-profiles", async (req, res) => {
    try {
      const profiles = await storage.getCompanyProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company profiles" });
    }
  });

  app.get("/api/company-profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  app.post("/api/company-profiles", async (req, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.parse(req.body);
      const profile = await storage.createCompanyProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company profile" });
    }
  });

  app.put("/api/company-profiles/:id", async (req, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { companyProfileId, framework } = req.query;
      
      let documents;
      if (companyProfileId) {
        documents = await storage.getDocumentsByCompanyProfile(companyProfileId as string);
      } else if (framework) {
        documents = await storage.getDocumentsByFramework(framework as string);
      } else {
        documents = await storage.getDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Document upload and RAG processing endpoint
  app.post('/api/documents/upload-and-extract', isAuthenticated, async (req: any, res) => {
    try {
      // Simulate document upload and AI extraction
      // In real implementation, this would:
      // 1. Process uploaded files (PDF, DOC, etc.)
      // 2. Use RAG/AI to extract company information
      // 3. Return structured data for auto-populating forms
      
      const extractedData = [
        {
          filename: "incorporation_docs.pdf",
          companyName: "TechCorp Solutions Inc.",
          incorporationDate: "2020-03-15",
          businessType: "Corporation",
          jurisdiction: "Delaware, USA",
          registrationNumber: "2020-001234",
          principals: [
            { name: "John Smith", role: "CEO" },
            { name: "Jane Doe", role: "CTO" }
          ],
          address: "123 Innovation Drive, San Francisco, CA 94105",
          contactInfo: {
            email: "info@techcorp.com",
            phone: "+1-555-0123"
          }
        }
      ];

      res.json({ 
        success: true, 
        extractedData,
        message: "Documents processed successfully" 
      });
    } catch (error) {
      logger.error('Error processing documents:', error);
      res.status(500).json({ message: 'Failed to process documents' });
    }
  });

  // AI document generation endpoint
  app.post('/api/documents/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { framework, category, title, description } = req.body;
      
      if (!framework || !category || !title) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Simulate AI document generation
      const generatedContent = `# ${title}

## Overview
This ${category} document has been generated for ${framework} compliance requirements.

${description ? `## Purpose\n${description}\n` : ''}

## 1. Introduction
This document establishes the ${title.toLowerCase()} for our organization in accordance with ${framework} requirements.

## 2. Scope
This policy applies to all employees, contractors, and third-party users who have access to organizational information systems.

## 3. Policy Statement
[Generated policy content based on ${framework} framework requirements...]

## 4. Roles and Responsibilities
- **Information Security Officer**: Overall responsibility for policy implementation
- **Management**: Ensuring adequate resources and support
- **Employees**: Compliance with all policy requirements

## 5. Implementation
[Implementation details specific to ${framework}...]

## 6. Compliance and Monitoring
Regular audits will be conducted to ensure compliance with this policy.

---
Document generated using AI on ${new Date().toISOString()}
Framework: ${framework}
Category: ${category}`;

      const document = await storage.createDocument({
        companyProfileId: req.body.companyProfileId || "temp-profile-id",
        createdBy: req.user?.claims?.sub || "temp-user-id",
        title,
        description,
        framework,
        category,
        content: generatedContent,
        documentType: "text",
        status: "draft",
        aiGenerated: true,
        aiModel: "gpt-4",
        generationPrompt: `Generate a ${category} document for ${framework} compliance`
      });

      res.json({ success: true, document });
    } catch (error) {
      logger.error('Error generating document:', error);
      res.status(500).json({ message: 'Failed to generate document' });
    }
  });

  // Document versions endpoints
  app.get('/api/documents/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user?.claims?.sub;
      
      const versions = await versionService.getVersionHistory(documentId);
      
      // Log version access
      await auditService.logAction({
        action: "view",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { action: "view_versions", versionCount: versions.length }
      });
      
      res.json(versions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching document versions:', { error: errorMessage, documentId: req.params.id }, req);
      res.status(500).json({ message: 'Failed to fetch document versions' });
    }
  });

  // Create new document version
  app.post('/api/documents/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const { title, content, changes, changeType = "minor" } = req.body;
      const documentId = req.params.id;
      const userId = req.user?.claims?.sub;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const version = await versionService.createVersion({
        documentId,
        title,
        content,
        changes,
        changeType,
        createdBy: userId
      });

      // Log version creation
      await auditService.logAction({
        action: "create",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        oldValues: { version: document.version },
        newValues: { version: version.versionNumber, changes, changeType },
        metadata: { versionId: version.id, changeType, automated: false }
      });

      res.json({ 
        success: true, 
        message: "Version created successfully",
        version
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating document version:', { error: errorMessage, documentId: req.params.id }, req);
      res.status(500).json({ message: 'Failed to create document version' });
    }
  });

  // Restore document version
  app.post('/api/documents/:id/versions/:versionId/restore', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const versionId = req.params.versionId;
      const userId = req.user?.claims?.sub;

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const restoredVersion = await versionService.restoreVersion(documentId, versionId);

      // Log version restoration
      await auditService.logAction({
        action: "update",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        oldValues: { version: document.version },
        newValues: { version: restoredVersion.versionNumber, restoredFromVersion: versionId },
        metadata: { 
          action: "version_restore", 
          versionId: versionId, 
          restoredVersionNumber: restoredVersion.versionNumber 
        }
      });

      res.json({ 
        success: true, 
        message: "Document restored to selected version",
        version: restoredVersion
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error restoring document version:', { error: errorMessage, documentId: req.params.id, versionId: req.params.versionId }, req);
      res.status(500).json({ message: 'Failed to restore document version' });
    }
  });

  // Compare document versions
  app.get('/api/documents/:id/versions/:version1/compare/:version2', isAuthenticated, async (req: any, res) => {
    try {
      const { id: documentId, version1, version2 } = req.params;
      const userId = req.user?.claims?.sub;

      const comparison = await versionService.compareVersions(documentId, version1, version2);

      // Log version comparison
      await auditService.logAction({
        action: "view",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { 
          action: "version_compare", 
          version1, 
          version2,
          diffCount: comparison.diff.added.length + comparison.diff.removed.length + comparison.diff.modified.length
        }
      });

      res.json(comparison);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error comparing document versions:', { error: errorMessage, documentId: req.params.id }, req);
      res.status(500).json({ message: 'Failed to compare document versions' });
    }
  });

  // Audit trail endpoints
  app.get('/api/audit-trail', isAuthenticated, async (req: any, res) => {
    try {
      const { page = 1, limit = 50, entityType, action, search, dateFrom, dateTo } = req.query;
      const userId = req.user?.claims?.sub;
      
      const auditQuery = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        ...(entityType && { entityType: entityType as string }),
        ...(action && { action: action as string }),
        ...(search && { search: search as string }),
        ...(dateFrom && { dateFrom: new Date(dateFrom as string) }),
        ...(dateTo && { dateTo: new Date(dateTo as string) })
      };

      const result = await auditService.getAuditLogs(auditQuery);
      
      // Log the audit trail access
      await auditService.logAction({
        action: "view",
        entityType: "audit_trail",
        entityId: "system",
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { filters: auditQuery }
      });

      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit trail:', { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });

  // Audit statistics endpoint
  app.get('/api/audit-trail/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await auditService.getAuditStats();
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit stats:', { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: 'Failed to fetch audit statistics' });
    }
  });

  // Document approvals endpoints
  app.get('/api/documents/:id/approvals', isAuthenticated, async (req: any, res) => {
    try {
      // Mock approvals data
      const mockApprovals = [
        {
          id: "approval-1",
          documentId: req.params.id,
          versionId: "ver-3",
          requestedBy: req.user?.claims?.sub || "user-1",
          approverRole: "ciso",
          assignedTo: "user-ciso",
          status: "approved",
          comments: "Approved after thorough review. All compliance requirements met.",
          priority: "high",
          dueDate: new Date("2024-08-20T17:00:00Z"),
          approvedAt: new Date("2024-08-14T16:45:00Z"),
          rejectedAt: null,
          createdAt: new Date("2024-08-14T10:00:00Z"),
          updatedAt: new Date("2024-08-14T16:45:00Z")
        }
      ];

      res.json(mockApprovals);
    } catch (error) {
      logger.error('Error fetching document approvals:', error);
      res.status(500).json({ message: 'Failed to fetch document approvals' });
    }
  });

  // Request document approval
  app.post('/api/documents/:id/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const { approverRole, assignedTo, comments, priority, dueDate } = req.body;
      
      // Create audit trail entry for approval request
      const auditEntry = {
        entityType: "document",
        entityId: req.params.id,
        action: "approve",
        userId: req.user?.claims?.sub || "temp-user-id",
        userEmail: req.user?.claims?.email,
        userName: req.user?.claims?.first_name + " " + req.user?.claims?.last_name,
        organizationId: "temp-org-id",
        oldValues: null,
        newValues: { approvalRequested: true, approverRole, priority },
        metadata: { action: "approval_request", approverRole, priority },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      };

      res.json({ 
        success: true, 
        message: "Approval request submitted successfully",
        approvalId: "new-approval-id"
      });
    } catch (error) {
      logger.error('Error requesting approval:', error);
      res.status(500).json({ message: 'Failed to request approval' });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Generation Job routes
  app.get("/api/generation-jobs", async (req, res) => {
    try {
      const { companyProfileId } = req.query;
      
      let jobs;
      if (companyProfileId) {
        jobs = await storage.getGenerationJobsByCompanyProfile(companyProfileId as string);
      } else {
        jobs = await storage.getGenerationJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generation jobs" });
    }
  });

  app.get("/api/generation-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getGenerationJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Generation job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generation job" });
    }
  });

  // Document generation endpoint with special rate limiting
  app.post("/api/generate-documents", generationLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const { companyProfileId, framework, model = 'auto', includeQualityAnalysis = false, enableCrossValidation = false } = req.body;
      const userId = req.user.claims.sub;
      
      if (!companyProfileId || !framework) {
        return res.status(400).json({ message: "Company profile ID and framework are required" });
      }

      const companyProfile = await storage.getCompanyProfile(companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const templates = frameworkTemplates[framework];
      if (!templates) {
        return res.status(400).json({ message: `Invalid framework: ${framework}` });
      }

      // Create generation job
      const job = await storage.createGenerationJob({
        companyProfileId,
        createdBy: userId,
        framework,
        status: "running",
        progress: 0,
        documentsGenerated: 0,
        totalDocuments: templates.length,
      });

      // Start enhanced generation process asynchronously
      (async () => {
        try {
          const options: GenerationOptions = {
            model: model as AIModel,
            includeQualityAnalysis,
            enableCrossValidation
          };

          const documents = await aiOrchestrator.generateComplianceDocuments(
            companyProfile,
            framework,
            options,
            async (progress) => {
              await storage.updateGenerationJob(job.id, {
                progress: progress.progress,
                documentsGenerated: progress.completed,
              });
            }
          );

          // Save generated documents with AI metadata
          for (let i = 0; i < documents.length; i++) {
            const template = templates[i];
            const result = documents[i];
            
            await storage.createDocument({
              companyProfileId,
              createdBy: userId,
              title: template.title,
              description: template.description,
              framework,
              category: template.category,
              content: result.content,
              status: "complete",
              aiGenerated: true,
              aiModel: result.model,
              generationPrompt: `Generated using ${result.model} with ${framework} framework`,
            });
          }

          // Mark job as completed
          await storage.updateGenerationJob(job.id, {
            status: "completed",
            progress: 100,
            documentsGenerated: templates.length,
          });
        } catch (error) {
          logger.error("Document generation failed:", error);
          await storage.updateGenerationJob(job.id, {
            status: "failed",
          });
        }
      })();

      res.status(202).json({ jobId: job.id, message: "Enhanced document generation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start document generation" });
    }
  });

  // Framework statistics endpoint
  app.get("/api/frameworks/:framework/stats", async (req, res) => {
    try {
      const { framework } = req.params;
      const { companyProfileId } = req.query;

      if (!companyProfileId) {
        return res.status(400).json({ message: "Company profile ID is required" });
      }

      const documents = await storage.getDocumentsByCompanyProfile(companyProfileId as string);
      const frameworkDocs = documents.filter(doc => doc.framework === framework);
      const templates = frameworkTemplates[framework] || [];
      
      const completedDocs = frameworkDocs.filter(doc => doc.status === 'complete').length;
      const totalDocs = templates.length;
      const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

      res.json({
        framework,
        completed: completedDocs,
        total: totalDocs,
        progress,
        documents: frameworkDocs,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch framework statistics" });
    }
  });

  // AI service endpoints - health check available without auth for monitoring
  app.get("/api/ai/models", isAuthenticated, async (req: any, res) => {
    try {
      const models = aiOrchestrator.getAvailableModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available models" });
    }
  });

  // This health check is now registered above before auth middleware

  app.post("/api/ai/analyze-quality", isAuthenticated, async (req: any, res) => {
    try {
      const { content, framework } = req.body;
      
      if (!content || !framework) {
        return res.status(400).json({ message: "Content and framework are required" });
      }

      const analysis = await aiOrchestrator.analyzeQuality(content, framework);
      metricsCollector.trackAIOperation('analysis', true);
      res.json(analysis);
    } catch (error) {
      logger.error("Quality analysis failed:", error);
      res.status(500).json({ message: "Failed to analyze document quality" });
    }
  });

  app.post("/api/ai/generate-insights", isAuthenticated, async (req: any, res) => {
    try {
      const { companyProfileId, framework } = req.body;
      const userId = req.user.claims.sub;
      
      if (!companyProfileId || !framework) {
        return res.status(400).json({ message: "Company profile ID and framework are required" });
      }

      const companyProfile = await storage.getCompanyProfile(companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const insights = await aiOrchestrator.generateInsights(companyProfile, framework);
      
      // Track AI operation and log insight generation for audit trail
      metricsCollector.trackAIOperation('analysis', true);
      await auditService.logAction({
        action: "generate_insights",
        entityType: "company_profile",
        entityId: companyProfileId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { framework, riskScore: insights.riskScore }
      });

      res.json(insights);
    } catch (error) {
      logger.error("Insight generation failed:", error);
      res.status(500).json({ message: "Failed to generate compliance insights" });
    }
  });

  app.post("/api/documents/generate-single", isAuthenticated, async (req: any, res) => {
    try {
      const { companyProfileId, framework, template, model = 'auto', includeQualityAnalysis = false } = req.body;
      const userId = req.user.claims.sub;
      
      if (!companyProfileId || !framework || !template) {
        return res.status(400).json({ message: "Company profile ID, framework, and template are required" });
      }

      const companyProfile = await storage.getCompanyProfile(companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const result = await aiOrchestrator.generateDocument(
        template,
        companyProfile,
        framework,
        { model: model as AIModel, includeQualityAnalysis }
      );

      // Save generated document
      const document = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: template.title,
        description: template.description,
        framework,
        category: template.category,
        content: result.content,
        status: "draft",
        aiGenerated: true,
        aiModel: result.model,
        generationPrompt: `Single document generation using ${result.model}`,
      });

      res.json({ 
        document, 
        quality: result.qualityScore ? {
          score: result.qualityScore,
          feedback: result.feedback,
          suggestions: result.suggestions
        } : null
      });
    } catch (error) {
      logger.error("Single document generation failed:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Phase 2: Document Analysis & RAG endpoints
  app.post("/api/ai/analyze-document", isAuthenticated, async (req: any, res) => {
    try {
      const { content, filename, framework } = req.body;
      
      if (!content || !filename) {
        return res.status(400).json({ message: "Content and filename are required" });
      }

      const analysis = await documentAnalysisService.analyzeDocument(content, filename, framework);
      
      await auditService.logAction({
        action: "analyze",
        entityType: "document",
        entityId: filename,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { framework, analysisType: "document" }
      });

      res.json(analysis);
    } catch (error: any) {
      logger.error("Document analysis failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  app.post("/api/ai/extract-profile", isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const extractedProfile = await documentAnalysisService.extractCompanyProfile(content);
      
      await auditService.logAction({
        action: "extract",
        entityType: "company_profile",
        entityId: `profile_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { extractionType: "profile" }
      });

      res.json(extractedProfile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Profile extraction failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to extract profile" });
    }
  });

  // Compliance Chatbot endpoints
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message, framework, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await complianceChatbot.processMessage(
        message,
        req.user.claims.sub,
        sessionId,
        framework
      );
      
      await auditService.logAction({
        action: "chat",
        entityType: "ai_conversation",
        entityId: sessionId || `chat_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { framework, messageLength: message.length }
      });

      res.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Chat processing failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/ai/chat/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const framework = req.query.framework as string;
      const suggestions = complianceChatbot.getSuggestedQuestions(framework);
      res.json(suggestions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Chat suggestions failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to get chat suggestions" });
    }
  });

  // Risk Assessment endpoints
  app.post("/api/ai/risk-assessment", isAuthenticated, async (req: any, res) => {
    try {
      const { frameworks, includeDocuments } = req.body;
      const userId = req.user.claims.sub;
      
      if (!frameworks || !Array.isArray(frameworks) || frameworks.length === 0) {
        return res.status(400).json({ message: "At least one framework is required" });
      }

      // Get user's company profile
      const companyProfile = await storage.getCompanyProfile(userId);
      if (!companyProfile) {
        return res.status(400).json({ message: "Company profile is required for risk assessment" });
      }

      // Get existing documents if requested
      let existingDocuments: string[] = [];
      if (includeDocuments) {
        const documents = await storage.getDocuments();
        const userDocs = documents.filter((doc: any) => doc.userId === userId);
        existingDocuments = userDocs.map((doc: any) => doc.title);
      }

      const assessment = await riskAssessmentService.assessOrganizationalRisk(
        companyProfile,
        frameworks,
        existingDocuments
      );
      
      await auditService.logAction({
        action: "assess",
        entityType: "risk_assessment",
        entityId: `risk_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { frameworks, includeDocuments }
      });

      res.json(assessment);
    } catch (error: any) {
      logger.error("Risk assessment failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to conduct risk assessment" });
    }
  });

  app.post("/api/ai/threat-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const { industry, companySize, frameworks } = req.body;
      
      if (!industry || !companySize || !frameworks) {
        return res.status(400).json({ message: "Industry, company size, and frameworks are required" });
      }

      const threatAnalysis = await riskAssessmentService.analyzeThreatLandscape(
        industry,
        companySize,
        frameworks
      );
      
      await auditService.logAction({
        action: "analyze",
        entityType: "threat_landscape",
        entityId: `threat_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { industry, companySize, frameworks }
      });

      res.json(threatAnalysis);
    } catch (error: any) {
      logger.error("Threat analysis failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze threat landscape" });
    }
  });

  // Quality Scoring endpoints
  app.post("/api/ai/quality-score", isAuthenticated, async (req: any, res) => {
    try {
      const { content, title, framework, documentType } = req.body;
      
      if (!content || !title || !framework || !documentType) {
        return res.status(400).json({ message: "Content, title, framework, and document type are required" });
      }

      const qualityScore = await qualityScoringService.analyzeDocumentQuality(
        content,
        title,
        framework,
        documentType
      );
      
      await auditService.logAction({
        action: "score",
        entityType: "document_quality",
        entityId: `quality_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { title, framework, documentType, score: qualityScore.overallScore }
      });

      res.json(qualityScore);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Quality scoring failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze document quality" });
    }
  });

  app.post("/api/ai/framework-alignment", isAuthenticated, async (req: any, res) => {
    try {
      const { content, framework, documentType } = req.body;
      
      if (!content || !framework || !documentType) {
        return res.status(400).json({ message: "Content, framework, and document type are required" });
      }

      const alignment = await qualityScoringService.checkFrameworkAlignment(
        content,
        framework,
        documentType
      );
      
      res.json(alignment);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Framework alignment check failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to check framework alignment" });
    }
  });

  // ============================================================================
  // OBJECT STORAGE API ENDPOINTS
  // ============================================================================

  // Upload document to object storage
  app.post("/api/storage/documents/:documentId", isAuthenticated, async (req: any, res) => {
    const { documentId } = req.params;
    const content = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadDocument(documentId, content);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: documentId,
        action: "create",
        userId,
        metadata: { 
          action: "storage_upload",
          storageProvider: "replit",
          path: result.path 
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'document');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Storage upload error', { documentId, error });
      res.status(500).json({ error: 'Storage upload failed' });
    }
  });

  // Download document from object storage
  app.get("/api/storage/documents/:documentId", isAuthenticated, async (req: any, res) => {
    const { documentId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadDocument(documentId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: documentId,
        action: "download",
        userId,
        metadata: { 
          action: "storage_download",
          storageProvider: "replit"
        }
      });

      metricsCollector.incrementCounter('storage_download', 'document');
      res.json({ success: true, data: result.data });
    } catch (error) {
      logger.error('Storage download error', { documentId, error });
      res.status(500).json({ error: 'Storage download failed' });
    }
  });

  // Upload company profile to object storage
  app.post("/api/storage/profiles/:profileId", isAuthenticated, async (req: any, res) => {
    const { profileId } = req.params;
    const profileData = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadCompanyProfile(profileId, profileData);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "company_profile",
        entityId: profileId,
        action: "create",
        userId,
        metadata: { 
          action: "storage_upload",
          storageProvider: "replit",
          path: result.path 
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'profile');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Profile storage upload error', { profileId, error });
      res.status(500).json({ error: 'Profile storage upload failed' });
    }
  });

  // Download company profile from object storage
  app.get("/api/storage/profiles/:profileId", isAuthenticated, async (req: any, res) => {
    const { profileId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadCompanyProfile(profileId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "company_profile",
        entityId: profileId,
        action: "download",
        userId,
        metadata: { 
          action: "storage_download",
          storageProvider: "replit"
        }
      });

      metricsCollector.incrementCounter('storage_download', 'profile');
      res.json({ success: true, data: result.data });
    } catch (error) {
      logger.error('Profile storage download error', { profileId, error });
      res.status(500).json({ error: 'Profile storage download failed' });
    }
  });

  // Upload file from bytes (for attachments, PDFs, images)
  app.post("/api/storage/files", isAuthenticated, async (req: any, res) => {
    const { filename, folder = 'files' } = req.body;
    const fileData = req.body.data; // Base64 or buffer data
    const userId = req.user?.claims?.sub;

    try {
      const buffer = Buffer.from(fileData, 'base64');
      const result = await objectStorageService.uploadFileFromBytes(filename, buffer, folder);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: filename,
        action: "create",
        userId,
        metadata: { 
          action: "file_upload",
          storageProvider: "replit",
          path: result.path,
          folder,
          fileType: filename.split('.').pop()
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'file');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('File storage upload error', { filename, error });
      res.status(500).json({ error: 'File storage upload failed' });
    }
  });

  // Download file as bytes
  app.get("/api/storage/files/:path(*)", isAuthenticated, async (req: any, res) => {
    const { path } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadFileAsBytes(path);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: path,
        action: "download",
        userId,
        metadata: { 
          action: "file_download",
          storageProvider: "replit",
          path
        }
      });

      metricsCollector.incrementCounter('storage_download', 'file');
      
      // Set appropriate headers for file download
      const fileExt = path.split('.').pop()?.toLowerCase();
      const contentType = getContentType(fileExt);
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
      res.send(result.data);
    } catch (error) {
      logger.error('File storage download error', { path, error });
      res.status(500).json({ error: 'File storage download failed' });
    }
  });

  // List objects in storage
  app.get("/api/storage/list", isAuthenticated, async (req: any, res) => {
    const { folder } = req.query;
    const userId = req.user?.claims?.sub;

    try {
      const result = folder 
        ? await objectStorageService.listObjectsInFolder(folder as string)
        : await objectStorageService.listObjects();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: folder || "root",
        action: "view",
        userId,
        metadata: { 
          action: "storage_list",
          storageProvider: "replit",
          folder: folder || "all",
          resultCount: result.files?.length || 0
        }
      });

      metricsCollector.incrementCounter('storage_list', folder || 'all');
      res.json({ success: true, files: result.files || [] });
    } catch (error) {
      logger.error('Storage list error', { folder, error });
      res.status(500).json({ error: 'Storage list failed' });
    }
  });

  // Delete object from storage
  app.delete("/api/storage/objects/*", isAuthenticated, async (req: any, res) => {
    const path = req.params[0];
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.deleteObject(path);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "document",
        entityId: path,
        action: "delete",
        userId,
        metadata: { 
          action: "storage_delete",
          storageProvider: "replit",
          path
        }
      });

      metricsCollector.incrementCounter('storage_delete', 'object');
      res.json({ success: true });
    } catch (error) {
      logger.error('Storage delete error', { path, error });
      res.status(500).json({ error: 'Storage delete failed' });
    }
  });

  // Get storage statistics
  app.get("/api/storage/stats", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.getStorageStats();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "organization",
        entityId: "storage-stats",
        action: "view",
        userId,
        metadata: { 
          action: "storage_stats",
          storageProvider: "replit",
          totalFiles: result.data?.totalFiles || 0
        }
      });

      metricsCollector.incrementCounter('storage_stats');
      res.json({ success: true, stats: result.data });
    } catch (error) {
      logger.error('Storage stats error', { error });
      res.status(500).json({ error: 'Storage stats failed' });
    }
  });

  // Upload backup data
  app.post("/api/storage/backups/:backupId", isAuthenticated, async (req: any, res) => {
    const { backupId } = req.params;
    const backupData = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadBackup(backupId, backupData);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "organization",
        entityId: backupId,
        action: "create",
        userId,
        metadata: { 
          action: "backup_upload",
          storageProvider: "replit",
          path: result.path,
          dataSize: JSON.stringify(backupData).length
        }
      });

      metricsCollector.incrementCounter('storage_backup', 'upload');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Backup upload error', { backupId, error });
      res.status(500).json({ error: 'Backup upload failed' });
    }
  });

  // Download backup data
  app.get("/api/storage/backups/:backupId", isAuthenticated, async (req: any, res) => {
    const { backupId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadBackup(backupId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "organization",
        entityId: backupId,
        action: "download",
        userId,
        metadata: { 
          action: "backup_download",
          storageProvider: "replit"
        }
      });

      metricsCollector.incrementCounter('storage_backup', 'download');
      res.json({ success: true, data: result.data });
    } catch (error) {
      logger.error('Backup download error', { backupId, error });
      res.status(500).json({ error: 'Backup download failed' });
    }
  });

  // Upload audit logs
  app.post("/api/storage/audit-logs/:logId", isAuthenticated, async (req: any, res) => {
    const { logId } = req.params;
    const auditLogs = req.body.logs;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadAuditLogs(logId, auditLogs);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log the audit trail
      await auditService.logAudit({
        entityType: "organization",
        entityId: logId,
        action: "create",
        userId,
        metadata: { 
          action: "audit_log_upload",
          storageProvider: "replit",
          path: result.path,
          logCount: auditLogs.length
        }
      });

      metricsCollector.incrementCounter('storage_audit', 'upload');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Audit logs upload error', { logId, error });
      res.status(500).json({ error: 'Audit logs upload failed' });
    }
  });

  // Helper function for content types
  function getContentType(extension: string | undefined): string {
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv'
    };
    
    return contentTypes[extension || ''] || 'application/octet-stream';
  }

  // AI Fine-tuning routes
  app.get("/api/ai/industries", isAuthenticated, async (req, res) => {
    try {
      const { AIFineTuningService } = await import('./services/aiFineTuningService');
      const service = new AIFineTuningService();
      const configurations = service.getIndustryConfigurations();
      res.json({ success: true, configurations });
    } catch (error) {
      logger.error("Error fetching industry configurations:", error);
      res.status(500).json({ success: false, error: "Failed to fetch configurations" });
    }
  });

  app.get("/api/ai/industries/:industryId", isAuthenticated, async (req, res) => {
    try {
      const { AIFineTuningService } = await import('./services/aiFineTuningService');
      const service = new AIFineTuningService();
      const configuration = service.getIndustryConfiguration(req.params.industryId);
      
      if (!configuration) {
        return res.status(404).json({ success: false, error: "Industry not found" });
      }
      
      res.json({ success: true, configuration });
    } catch (error) {
      logger.error("Error fetching industry configuration:", error);
      res.status(500).json({ success: false, error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/ai/fine-tune", isAuthenticated, async (req, res) => {
    try {
      const { industryId, requirements, customInstructions, priority } = req.body;
      const userId = req.user?.claims?.sub;

      if (!industryId || !requirements) {
        return res.status(400).json({ 
          success: false, 
          error: "Industry ID and requirements are required" 
        });
      }

      const { AIFineTuningService } = await import('./services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const result = await service.createCustomConfiguration({
        industryId,
        organizationId: userId,
        requirements: Array.isArray(requirements) ? requirements : [requirements],
        customInstructions,
        priority: priority || 'medium'
      });

      // Log the fine-tuning operation
      await storage.createAuditEntry({
        userId,
        action: "ai_fine_tuning_created",
        entityType: "ai_configuration",
        entityId: result.configId,
        details: { industryId, accuracy: result.accuracy },
        metadata: { requirements, customInstructions, priority }
      });

      res.json({ success: true, result });
    } catch (error) {
      logger.error("Error creating fine-tuning configuration:", error);
      res.status(500).json({ success: false, error: "Failed to create configuration" });
    }
  });

  app.post("/api/ai/generate-optimized", isAuthenticated, async (req, res) => {
    try {
      const { configId, documentType, context } = req.body;
      const userId = req.user?.claims?.sub;

      if (!documentType || !context) {
        return res.status(400).json({ 
          success: false, 
          error: "Document type and context are required" 
        });
      }

      const { AIFineTuningService } = await import('./services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const generatedContent = await service.generateOptimizedDocument(
        configId || `default-${context.industry}`,
        documentType,
        context
      );

      // Log the optimized generation
      await storage.createAuditEntry({
        userId,
        action: "ai_optimized_generation",
        entityType: "document",
        entityId: `opt-${Date.now()}`,
        details: { documentType, industry: context.industry },
        metadata: { configId, context }
      });

      res.json({ success: true, content: generatedContent });
    } catch (error) {
      logger.error("Error generating optimized document:", error);
      res.status(500).json({ success: false, error: "Failed to generate document" });
    }
  });

  app.post("/api/ai/assess-risks", isAuthenticated, async (req, res) => {
    try {
      const { industryId, organizationContext } = req.body;
      const userId = req.user?.claims?.sub;

      if (!industryId || !organizationContext) {
        return res.status(400).json({ 
          success: false, 
          error: "Industry ID and organization context are required" 
        });
      }

      const { AIFineTuningService } = await import('./services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const riskAssessment = await service.assessIndustryRisks(industryId, organizationContext);

      // Log the risk assessment
      await storage.createAuditEntry({
        userId,
        action: "ai_risk_assessment",
        entityType: "risk_assessment",
        entityId: `risk-${Date.now()}`,
        details: { industryId, riskScore: riskAssessment.riskScore },
        metadata: { organizationContext, identifiedRisks: riskAssessment.identifiedRisks.length }
      });

      res.json({ success: true, assessment: riskAssessment });
    } catch (error) {
      logger.error("Error assessing industry risks:", error);
      res.status(500).json({ success: false, error: "Failed to assess risks" });
    }
  });

  // Gap Analysis Routes
  app.get("/api/gap-analysis/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userOrganizations = await storage.getUserOrganizations(userId);
      
      if (userOrganizations.length === 0) {
        return res.json([]);
      }

      // For now, get reports from the first organization
      const organizationId = userOrganizations[0].organizationId;
      const reports = await storage.getGapAnalysisReports(organizationId);
      
      res.json(reports);
    } catch (error) {
      logger.error("Error fetching gap analysis reports", { 
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/gap-analysis/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getGapAnalysisReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get findings and recommendations
      const findings = await storage.getGapAnalysisFindings(id);
      const recommendations = [];
      
      for (const finding of findings) {
        const findingRecommendations = await storage.getRemediationRecommendations(finding.id);
        recommendations.push(...findingRecommendations);
      }

      // Get maturity assessment if available
      const maturityAssessment = await storage.getComplianceMaturityAssessment(
        report.organizationId, 
        report.framework
      );

      // Generate executive summary
      const executiveSummary = {
        overallScore: report.overallScore,
        criticalGaps: findings.filter(f => f.riskLevel === 'critical').length,
        highPriorityActions: recommendations.filter(r => r.priority >= 4).length,
        estimatedRemediationTime: '3-6 months',
        topRisks: findings
          .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high')
          .slice(0, 5)
          .map(f => f.controlTitle)
      };

      res.json({
        report,
        findings,
        recommendations,
        maturityAssessment,
        executiveSummary
      });
    } catch (error) {
      logger.error("Error fetching gap analysis report details", { 
        reportId: req.params.id,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to fetch report details" });
    }
  });

  app.post("/api/gap-analysis/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { framework, includeMaturityAssessment, focusAreas } = req.body;
      
      const userOrganizations = await storage.getUserOrganizations(userId);
      if (userOrganizations.length === 0) {
        return res.status(400).json({ message: "User not associated with any organization" });
      }

      const organizationId = userOrganizations[0].organizationId;
      const companyProfiles = await storage.getCompanyProfiles(organizationId);
      
      if (companyProfiles.length === 0) {
        return res.status(400).json({ message: "No company profile found" });
      }

      const companyProfile = companyProfiles[0];

      // Create initial report
      const report = await storage.createGapAnalysisReport({
        organizationId,
        framework,
        overallScore: 0,
        status: 'in_progress',
        metadata: {
          includeMaturityAssessment,
          focusAreas: focusAreas || []
        }
      });

      // Start background analysis (simplified for demo)
      setTimeout(async () => {
        try {
          // Simulate analysis results
          const mockFindings = [
            {
              reportId: report.id,
              controlId: 'A.5.1',
              controlTitle: 'Information security policies',
              currentStatus: 'partially_implemented' as const,
              riskLevel: 'high' as const,
              gapDescription: 'Information security policy exists but lacks comprehensive coverage of cloud services and remote work arrangements.',
              businessImpact: 'Moderate risk of security incidents due to unclear guidelines for cloud service usage and remote access.',
              evidenceRequired: 'Updated policy documents, training records, and compliance attestations',
              complianceScore: 65,
              priority: 4,
              estimatedEffort: 'medium' as const
            },
            {
              reportId: report.id,
              controlId: 'A.8.1',
              controlTitle: 'Asset inventory',
              currentStatus: 'not_implemented' as const,
              riskLevel: 'critical' as const,
              gapDescription: 'No comprehensive asset inventory system in place. IT assets are tracked informally.',
              businessImpact: 'High risk of unauthorized access, data loss, and compliance violations due to unknown asset exposure.',
              evidenceRequired: 'Asset management system, asset register, and ownership documentation',
              complianceScore: 25,
              priority: 5,
              estimatedEffort: 'high' as const
            },
            {
              reportId: report.id,
              controlId: 'A.12.1',
              controlTitle: 'Secure development lifecycle',
              currentStatus: 'implemented' as const,
              riskLevel: 'medium' as const,
              gapDescription: 'Development practices include security reviews but lack automated security testing.',
              businessImpact: 'Low to moderate risk of security vulnerabilities in applications.',
              evidenceRequired: 'SDLC documentation, security testing reports, and code review records',
              complianceScore: 80,
              priority: 3,
              estimatedEffort: 'medium' as const
            }
          ];

          // Create findings
          for (const findingData of mockFindings) {
            const finding = await storage.createGapAnalysisFinding(findingData);
            
            // Create recommendations for high priority findings
            if (findingData.priority >= 4) {
              await storage.createRemediationRecommendation({
                findingId: finding.id,
                title: `Implement ${findingData.controlTitle}`,
                description: `Address the identified gaps in ${findingData.controlTitle} to improve compliance posture.`,
                implementation: 'Develop comprehensive implementation plan with stakeholder engagement and phased rollout.',
                resources: {
                  templates: ['Policy template', 'Implementation checklist'],
                  tools: ['Asset management system', 'Compliance tracking tool'],
                  references: ['ISO 27001 guidance', 'Industry best practices']
                },
                timeframe: findingData.estimatedEffort === 'high' ? 'long_term' : 'medium_term',
                cost: findingData.estimatedEffort,
                priority: findingData.priority,
                status: 'pending'
              });
            }
          }

          // Calculate overall score
          const overallScore = Math.round(
            mockFindings.reduce((sum, f) => sum + f.complianceScore, 0) / mockFindings.length
          );

          // Update report status
          await storage.updateGapAnalysisReport(report.id, {
            status: 'completed',
            overallScore
          });

          // Create maturity assessment if requested
          if (includeMaturityAssessment) {
            await storage.createComplianceMaturityAssessment({
              organizationId,
              framework,
              maturityLevel: 3,
              assessmentData: {
                maturityLabel: 'Defined',
                averageScore: overallScore,
                controlsAssessed: mockFindings.length,
                implementationBreakdown: {
                  notImplemented: mockFindings.filter(f => f.currentStatus === 'not_implemented').length,
                  partiallyImplemented: mockFindings.filter(f => f.currentStatus === 'partially_implemented').length,
                  implemented: mockFindings.filter(f => f.currentStatus === 'implemented').length,
                  fullyCompliant: mockFindings.filter(f => f.currentStatus === 'fully_compliant').length
                }
              },
              recommendations: {
                nextSteps: [
                  'Focus on critical and high-risk findings first',
                  'Establish formal documentation processes',
                  'Implement regular review and monitoring procedures'
                ],
                improvementAreas: mockFindings
                  .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high')
                  .map(f => f.controlTitle)
              }
            });
          }

        } catch (error) {
          logger.error("Error in gap analysis background processing", { 
            reportId: report.id,
            error: error instanceof Error ? error.message : String(error)
          });
          
          await storage.updateGapAnalysisReport(report.id, {
            status: 'failed'
          });
        }
      }, 2000); // 2 second delay to simulate processing

      res.json({ 
        message: "Gap analysis started",
        reportId: report.id
      });
    } catch (error) {
      logger.error("Error starting gap analysis", { 
        framework: req.body.framework,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to start gap analysis" });
    }
  });

  app.patch("/api/gap-analysis/recommendations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updates: Partial<RemediationRecommendation> = { status };
      if (status === 'completed') {
        updates.completedDate = new Date();
      }

      const recommendation = await storage.updateRemediationRecommendation(id, updates);
      
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json(recommendation);
    } catch (error) {
      logger.error("Error updating recommendation", { 
        recommendationId: req.params.id,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
