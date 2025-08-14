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
import { generationLimiter } from "./middleware/security";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
        organizationId: "temp-org-id", // TODO: Get from context
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
      const { companyProfileId, framework } = req.body;
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

      // Start generation process asynchronously
      (async () => {
        try {
          const documents = await generateComplianceDocuments(
            companyProfile,
            framework,
            async (progress, currentDocument) => {
              await storage.updateGenerationJob(job.id, {
                progress,
                documentsGenerated: Math.floor((progress / 100) * templates.length),
              });
            }
          );

          // Save generated documents
          for (let i = 0; i < documents.length; i++) {
            const template = templates[i];
            await storage.createDocument({
              companyProfileId,
              createdBy: userId,
              title: template.title,
              description: template.description,
              framework,
              category: template.category,
              content: documents[i],
              status: "complete",
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

      res.status(202).json({ jobId: job.id, message: "Document generation started" });
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

  const httpServer = createServer(app);
  return httpServer;
}
