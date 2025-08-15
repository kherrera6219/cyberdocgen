import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditService } from "./services/auditService";
import { versionService } from "./services/versionService";
import { logger } from "./utils/logger";
import { validateSchema, paginationSchema, idParamSchema } from "./utils/validation";
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
      console.error("AI Health check failed:", error);
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
      console.error("Error fetching organizations:", error);
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
      console.error("Error creating organization:", error);
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
      console.error('Error processing documents:', error);
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
      console.error('Error generating document:', error);
      res.status(500).json({ message: 'Failed to generate document' });
    }
  });

  // Document versions endpoints
  app.get('/api/documents/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      // Mock versions data - replace with actual storage call
      const mockVersions = [
        {
          id: "ver-3",
          documentId: req.params.id,
          versionNumber: 3,
          title: "Information Security Policy v3.0",
          content: "# Information Security Policy v3.0\n\n## Overview...",
          changes: "Major update: Added cloud security controls, enhanced incident response",
          changeType: "major",
          createdBy: req.user?.claims?.sub || "user-1",
          createdAt: new Date("2024-08-14T16:00:00Z"),
          status: "published",
          fileSize: 45000,
          checksum: "a1b2c3d4e5f6..."
        },
        {
          id: "ver-2",
          documentId: req.params.id,
          versionNumber: 2,
          title: "Information Security Policy v2.1",
          content: "# Information Security Policy v2.1\n\n## Overview...",
          changes: "Minor update: Fixed typos, updated compliance references",
          changeType: "minor",
          createdBy: req.user?.claims?.sub || "user-1",
          createdAt: new Date("2024-08-10T14:30:00Z"),
          status: "archived",
          fileSize: 42000,
          checksum: "b2c3d4e5f6g7..."
        }
      ];
      
      res.json(mockVersions);
    } catch (error) {
      console.error('Error fetching document versions:', error);
      res.status(500).json({ message: 'Failed to fetch document versions' });
    }
  });

  // Create new document version
  app.post('/api/documents/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const { changes, changeType } = req.body;
      
      // Create audit trail entry
      const auditEntry = {
        entityType: "document",
        entityId: req.params.id,
        action: "update",
        userId: req.user?.claims?.sub || "temp-user-id",
        userEmail: req.user?.claims?.email,
        userName: req.user?.claims?.first_name + " " + req.user?.claims?.last_name,
        organizationId: req.user?.organizationId || "default-org",
        oldValues: { version: "previous" },
        newValues: { version: "new", changes, changeType },
        metadata: { changeType, automated: false },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      };

      // In real implementation, create version and audit entry
      res.json({ 
        success: true, 
        message: "Version created successfully",
        versionId: "new-version-id"
      });
    } catch (error) {
      console.error('Error creating document version:', error);
      res.status(500).json({ message: 'Failed to create document version' });
    }
  });

  // Restore document version
  app.post('/api/documents/:id/versions/:versionId/restore', isAuthenticated, async (req: any, res) => {
    try {
      // Create audit trail entry
      const auditEntry = {
        entityType: "document",
        entityId: req.params.id,
        action: "update",
        userId: req.user?.claims?.sub || "temp-user-id",
        userEmail: req.user?.claims?.email,
        userName: req.user?.claims?.first_name + " " + req.user?.claims?.last_name,
        organizationId: "temp-org-id",
        oldValues: { currentVersion: "current" },
        newValues: { restoredFromVersion: req.params.versionId },
        metadata: { action: "version_restore", versionId: req.params.versionId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      };

      res.json({ 
        success: true, 
        message: "Document restored to selected version"
      });
    } catch (error) {
      console.error('Error restoring document version:', error);
      res.status(500).json({ message: 'Failed to restore document version' });
    }
  });

  // Audit trail endpoints
  app.get('/api/audit-trail', isAuthenticated, async (req: any, res) => {
    try {
      // Mock audit trail data
      const mockAuditTrail = [
        {
          id: "audit-1",
          entityType: "document",
          entityId: "doc-1",
          action: "create",
          userId: req.user?.claims?.sub || "user-1",
          userEmail: req.user?.claims?.email || "user@company.com",
          userName: (req.user?.claims?.first_name || "User") + " " + (req.user?.claims?.last_name || "Name"),
          organizationId: "org-1",
          oldValues: null,
          newValues: {
            title: "Information Security Policy",
            framework: "ISO27001",
            status: "draft"
          },
          metadata: {
            documentType: "policy",
            framework: "ISO27001"
          },
          timestamp: new Date("2024-08-14T10:30:00Z"),
          ipAddress: "192.168.1.100",
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID
        },
        {
          id: "audit-2",
          entityType: "document",
          entityId: "doc-1",
          action: "approve",
          userId: req.user?.claims?.sub || "user-2",
          userEmail: req.user?.claims?.email || "ciso@company.com",
          userName: "Chief Information Security Officer",
          organizationId: "org-1",
          oldValues: { status: "in_progress" },
          newValues: { status: "approved" },
          metadata: { approverRole: "ciso" },
          timestamp: new Date("2024-08-14T16:45:00Z"),
          ipAddress: "192.168.1.102",
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID
        }
      ];

      res.json(mockAuditTrail);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
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
      console.error('Error fetching document approvals:', error);
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
      console.error('Error requesting approval:', error);
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
          console.error("Document generation failed:", error);
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
      console.error("Quality analysis failed:", error);
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
      console.error("Insight generation failed:", error);
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
      console.error("Single document generation failed:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
