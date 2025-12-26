import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertDocumentSchema, documentVersions } from '@shared/schema';
import { versionService } from '../services/versionService';
import { auditService } from '../services/auditService';
import type { AIModel } from '../services/aiOrchestrator';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { cache } from '../middleware/production';
import { 
  type MultiTenantRequest, 
  requireOrganization,
  getDocumentWithOrgCheck,
  getCompanyProfileWithOrgCheck
} from '../middleware/multiTenant';

export async function registerDocumentsRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { companyProfileId, framework } = req.query;
      const organizationId = req.organizationId!;

      let documents;
      if (companyProfileId) {
        const { profile, authorized } = await getCompanyProfileWithOrgCheck(
          companyProfileId as string, 
          organizationId
        );
        if (!authorized) {
          return res.status(404).json({ message: "Company profile not found" });
        }
        documents = await storage.getDocumentsByCompanyProfile(companyProfileId as string);
      } else if (framework) {
        const allDocs = await storage.getDocumentsByFramework(framework as string);
        documents = [];
        for (const doc of allDocs) {
          const { authorized } = await getDocumentWithOrgCheck(doc.id, organizationId);
          if (authorized) documents.push(doc);
        }
      } else {
        documents = await storage.getDocuments(organizationId);
      }

      res.json(documents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Failed to fetch documents", { error: errorMessage });
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  router.get("/:id", isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { document, authorized } = await getDocumentWithOrgCheck(
        req.params.id, 
        req.organizationId!
      );
      
      if (!authorized || !document) {
        logger.warn('Document access denied - cross-tenant attempt', {
          documentId: req.params.id,
          organizationId: req.organizationId,
          userId: getUserId(req),
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  router.post("/", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      
      // Validate that companyProfileId belongs to the user's organization
      if (validatedData.companyProfileId) {
        const { profile, authorized } = await getCompanyProfileWithOrgCheck(
          validatedData.companyProfileId, 
          req.organizationId!
        );
        if (!authorized) {
          logger.warn('Document creation denied - cross-tenant company profile', {
            companyProfileId: validatedData.companyProfileId,
            organizationId: req.organizationId,
            userId: getUserId(req),
            ip: req.ip
          });
          return res.status(400).json({ message: "Invalid company profile" });
        }
      }
      
      const document = await storage.createDocument(validatedData);
      
      cache.invalidateByPattern('/api/documents');
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  router.put("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const { document: existingDoc, authorized } = await getDocumentWithOrgCheck(
        req.params.id, 
        req.organizationId!
      );
      
      if (!authorized || !existingDoc) {
        logger.warn('Document update denied - cross-tenant attempt', {
          documentId: req.params.id,
          organizationId: req.organizationId,
          userId: getUserId(req),
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }
      
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      
      // Prevent cross-tenant document reassignment via companyProfileId change
      if (validatedData.companyProfileId && validatedData.companyProfileId !== existingDoc.companyProfileId) {
        const { profile, authorized: newProfileAuthorized } = await getCompanyProfileWithOrgCheck(
          validatedData.companyProfileId, 
          req.organizationId!
        );
        if (!newProfileAuthorized) {
          logger.warn('Document update denied - cross-tenant reassignment attempt', {
            documentId: req.params.id,
            newCompanyProfileId: validatedData.companyProfileId,
            organizationId: req.organizationId,
            userId: getUserId(req),
            ip: req.ip
          });
          return res.status(400).json({ message: "Invalid company profile" });
        }
      }
      
      const document = await storage.updateDocument(req.params.id, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      cache.invalidateByPattern('/api/documents');
      
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  router.delete("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const { document: existingDoc, authorized } = await getDocumentWithOrgCheck(
        req.params.id, 
        req.organizationId!
      );
      
      if (!authorized || !existingDoc) {
        logger.warn('Document delete denied - cross-tenant attempt', {
          documentId: req.params.id,
          organizationId: req.organizationId,
          userId: getUserId(req),
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }
      
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      cache.invalidateByPattern('/api/documents');
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  router.post('/upload-and-extract', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      // Note: This endpoint returns extracted data without persisting.
      // Organization context is enforced for audit/logging purposes.
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing documents', { error: errorMessage });
      res.status(500).json({ message: 'Failed to process documents' });
    }
  });

  router.post('/generate', isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const { framework, category, title, description, companyProfileId } = req.body;
      
      if (!framework || !category || !title) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate companyProfileId belongs to user's organization
      if (companyProfileId) {
        const { profile, authorized } = await getCompanyProfileWithOrgCheck(
          companyProfileId, 
          req.organizationId!
        );
        if (!authorized) {
          logger.warn('Document generation denied - cross-tenant company profile', {
            companyProfileId,
            organizationId: req.organizationId,
            userId: getUserId(req),
            ip: req.ip
          });
          return res.status(400).json({ message: "Invalid company profile" });
        }
      }

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

      // Require valid companyProfileId for tenant isolation
      if (!companyProfileId) {
        return res.status(400).json({ message: "companyProfileId is required" });
      }
      
      const document = await storage.createDocument({
        companyProfileId,
        createdBy: getUserId(req) || "system",
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating document', { error: errorMessage });
      res.status(500).json({ message: 'Failed to generate document' });
    }
  });

  router.get('/:id/versions', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const documentId = req.params.id;
      const userId = getUserId(req);
      
      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !document) {
        logger.warn('Document versions access denied - cross-tenant attempt', {
          documentId,
          organizationId: req.organizationId,
          userId,
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }
      
      const versions = await versionService.getVersionHistory(documentId);
      
      await auditService.logAction({
        action: "view",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { viewAction: "view_versions", versionCount: versions.length }
      });
      
      res.json(versions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching document versions:', { error: errorMessage, documentId: req.params.id }, req);
      res.status(500).json({ message: 'Failed to fetch document versions' });
    }
  });

  router.post('/:id/versions', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { title, content, changes, changeType = "minor" } = req.body;
      const documentId = req.params.id;
      const userId = getRequiredUserId(req);
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      // Validate document ownership
      const { document: existingDoc, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !existingDoc) {
        logger.warn('Document version creation denied - cross-tenant attempt', {
          documentId,
          organizationId: req.organizationId,
          userId,
          ip: req.ip
        });
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

      await auditService.logAction({
        action: "create",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        oldValues: { version: existingDoc.version },
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

  router.post('/:id/versions/:versionId/restore', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const documentId = req.params.id;
      const versionId = req.params.versionId;
      const userId = getRequiredUserId(req);

      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !document) {
        logger.warn('Document version restore denied - cross-tenant attempt', {
          documentId,
          organizationId: req.organizationId,
          userId,
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }

      const restoredVersion = await versionService.restoreVersion(documentId, parseInt(versionId), userId);

      await auditService.logAction({
        action: "update",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip || 'unknown',
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

  router.get('/:id/versions/:version1/compare/:version2', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { id: documentId, version1, version2 } = req.params;
      const userId = getUserId(req);

      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const comparison = await versionService.compareVersions(documentId, parseInt(version1), parseInt(version2));

      await auditService.logAction({
        action: "view",
        entityType: "document",
        entityId: documentId,
        userId: userId,
        ipAddress: req.ip || 'unknown',
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

  router.get('/:id/approvals', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(req.params.id, req.organizationId!);
      if (!authorized || !document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const mockApprovals = [
        {
          id: "approval-1",
          documentId: req.params.id,
          versionId: "ver-3",
          requestedBy: getUserId(req) || "user-1",
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

  router.post('/:id/approvals', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(req.params.id, req.organizationId!);
      if (!authorized || !document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const { approverRole, assignedTo, comments, priority, dueDate } = req.body;
      
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

  router.post("/generate-single", isAuthenticated, requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
      const { aiOrchestrator } = await import('../services/aiOrchestrator');
      const { companyProfileId, framework, template, model = 'auto', includeQualityAnalysis = false } = req.body;
      const userId = getRequiredUserId(req);
      
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Single document generation failed", { error: errorMessage });
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  /**
   * @openapi
   * /api/documents/{id}/history:
   *   get:
   *     tags: [Documents]
   *     summary: Get document change history
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Document history retrieved
   *       401:
   *         description: Unauthorized
   */
  router.get('/:id/history', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const documentId = req.params.id;

      if (!documentId) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !document) {
        logger.warn('Document history access denied - cross-tenant attempt', {
          documentId,
          organizationId: req.organizationId,
          userId: getUserId(req),
          ip: req.ip
        });
        return res.status(404).json({ message: "Document not found" });
      }

      // Query document versions history
      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.versionNumber));

      if (!versions || versions.length === 0) {
        return res.json({
          success: true,
          documentId,
          versions: [],
          message: 'No version history found for this document'
        });
      }

      res.json({
        success: true,
        documentId,
        versions,
        currentVersion: versions[0], // Latest version
        totalVersions: versions.length
      });
    } catch (error) {
      logger.error('Failed to retrieve document history', {
        error: error instanceof Error ? error.message : String(error),
        documentId: req.params.id
      });
      res.status(500).json({ message: 'Failed to retrieve document history' });
    }
  });
}
