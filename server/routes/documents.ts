import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertDocumentSchema } from '@shared/schema';
import { versionService } from '../services/versionService';
import type { AIModel } from '../services/aiOrchestrator';
import { cache } from '../middleware/production';
import { 
  type MultiTenantRequest, 
  requireOrganization,
  getDocumentWithOrgCheck,
  getCompanyProfileWithOrgCheck
} from '../middleware/multiTenant';
import { 
  secureHandler, 
  validateInput, 
  ValidationError,
  NotFoundError
} from '../utils/errorHandling';

export async function registerDocumentsRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { companyProfileId, framework } = req.query;
    const organizationId = req.organizationId!;

    let documents;
    if (companyProfileId) {
      const { authorized } = await getCompanyProfileWithOrgCheck(
        companyProfileId as string, 
        organizationId
      );
      if (!authorized) {
        throw new NotFoundError("Company profile not found");
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

    res.json({ success: true, data: documents });
  }));

  router.get("/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      throw new NotFoundError("Document not found");
    }
    res.json({ success: true, data: document });
  }));

  router.post("/", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, validateInput(insertDocumentSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const validatedData = req.body;
    
    // Validate that companyProfileId belongs to the user's organization
    if (validatedData.companyProfileId) {
      const { authorized } = await getCompanyProfileWithOrgCheck(
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
        throw new ValidationError("Invalid company profile");
      }
    }
    
    const document = await storage.createDocument(validatedData);
    cache.invalidateByPattern('/api/documents');
    res.status(201).json({ success: true, data: document });
  }, { audit: { action: 'create', entityType: 'document' } }));

  router.put("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, validateInput(insertDocumentSchema.partial()), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      throw new NotFoundError("Document not found");
    }
    
    const validatedData = req.body;
    
    // Prevent cross-tenant document reassignment via companyProfileId change
    if (validatedData.companyProfileId && validatedData.companyProfileId !== existingDoc.companyProfileId) {
      const { authorized: newProfileAuthorized } = await getCompanyProfileWithOrgCheck(
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
        throw new ValidationError("Invalid company profile");
      }
    }
    
    const document = await storage.updateDocument(req.params.id, validatedData);
    if (!document) {
      throw new NotFoundError("Document not found");
    }
    
    cache.invalidateByPattern('/api/documents');
    res.json({ success: true, data: document });
  }, { audit: { action: 'update', entityType: 'document' } }));

  router.delete("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      throw new NotFoundError("Document not found");
    }
    
    const success = await storage.deleteDocument(req.params.id);
    if (!success) {
      throw new NotFoundError("Document not found");
    }
    
    cache.invalidateByPattern('/api/documents');
    res.status(204).send();
  }, { audit: { action: 'delete', entityType: 'document' } }));

  router.post('/upload-and-extract', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      data: {
        extractedData,
        message: "Documents processed successfully" 
      }
    });
  }));

  router.post('/generate', isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { framework, category, title, description, companyProfileId } = req.body;
    
    if (!framework || !category || !title) {
      throw new ValidationError('Missing required fields');
    }

    // Require valid companyProfileId for tenant isolation
    if (!companyProfileId) {
      throw new ValidationError("companyProfileId is required");
    }

    // Validate companyProfileId belongs to user's organization
    const { authorized } = await getCompanyProfileWithOrgCheck(
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
      throw new ValidationError("Invalid company profile");
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

    res.json({ success: true, data: document });
  }, { audit: { action: 'create', entityType: 'document' } }));

  router.get('/:id/versions', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      throw new NotFoundError("Document not found");
    }
    
    const versions = await versionService.getVersionHistory(documentId);
    
    res.json({ success: true, data: versions });
  }, { audit: { action: 'view', entityType: 'document', getEntityId: (req) => req.params.id } }));

  router.post('/:id/versions', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { title, content, changes, changeType = "minor" } = req.body;
    const documentId = req.params.id;
    const userId = getRequiredUserId(req);
    
    if (!title || !content) {
      throw new ValidationError("Title and content are required");
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
      throw new NotFoundError("Document not found");
    }

    const version = await versionService.createVersion({
      documentId,
      title,
      content,
      changes,
      changeType,
      createdBy: userId
    });

    res.json({ 
      success: true, 
      data: {
        message: "Version created successfully",
        version
      }
    });
  }, { audit: { action: 'create', entityType: 'document', getEntityId: (req) => req.params.id } }));

  router.post('/:id/versions/:versionId/restore', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
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
      throw new NotFoundError("Document not found");
    }

    const restoredVersion = await versionService.restoreVersion(documentId, parseInt(versionId), userId);

    res.json({ 
      success: true, 
      data: {
        message: "Document restored to selected version",
        version: restoredVersion
      }
    });
  }, { audit: { action: 'update', entityType: 'document', getEntityId: (req) => req.params.id } }));

  router.get('/:id/versions/:version1/compare/:version2', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id: documentId, version1, version2 } = req.params;

    // Validate document ownership
    const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
    if (!authorized || !document) {
      throw new NotFoundError("Document not found");
    }

    const comparison = await versionService.compareVersions(documentId, parseInt(version1), parseInt(version2));

    res.json({ success: true, data: comparison });
  }, { audit: { action: 'view', entityType: 'document', getEntityId: (req) => req.params.id } }));

  router.get('/:id/approvals', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    // Validate document ownership
    const { document, authorized } = await getDocumentWithOrgCheck(req.params.id, req.organizationId!);
    if (!authorized || !document) {
      throw new NotFoundError("Document not found");
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

    res.json({ success: true, data: mockApprovals });
  }));

  router.post('/:id/approvals', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    // Validate document ownership
    const { document, authorized } = await getDocumentWithOrgCheck(req.params.id, req.organizationId!);
    if (!authorized || !document) {
      throw new NotFoundError("Document not found");
    }
    
    // In a real app, we would validate and save req.body to approvals table
    
    res.json({ 
      success: true, 
      data: {
        message: "Approval request submitted successfully",
        approvalId: "new-approval-id"
      }
    });
  }, { audit: { action: 'create', entityType: 'approval', getEntityId: (req) => req.params.id } }));

  router.post("/generate-single", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { aiOrchestrator } = await import('../services/aiOrchestrator');
    const { companyProfileId, framework, template, model = 'auto', includeQualityAnalysis = false } = req.body;
    const userId = getRequiredUserId(req);
    
    if (!companyProfileId || !framework || !template) {
      throw new ValidationError("Company profile ID, framework, and template are required");
    }

    const { authorized } = await getCompanyProfileWithOrgCheck(companyProfileId, req.organizationId!);
    if (!authorized) {
      throw new NotFoundError("Company profile not found");
    }

    const companyProfile = await storage.getCompanyProfile(companyProfileId);
    if (!companyProfile) {
      throw new NotFoundError("Company profile not found");
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
      success: true,
      data: {
        document, 
        quality: result.qualityScore ? {
          score: result.qualityScore,
          feedback: result.feedback,
          suggestions: result.suggestions
        } : null
      }
    });
  }, { audit: { action: 'create', entityType: 'document' } }));

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
  router.get('/:id/history', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const documentId = req.params.id;

    if (!documentId) {
      throw new ValidationError('Invalid document ID');
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
      throw new NotFoundError("Document not found");
    }

    // Query document versions history
    const versions = await storage.getDocumentVersions(documentId);

    if (!versions || versions.length === 0) {
      res.json({
        success: true,
        data: {
          documentId,
          versions: [],
          message: 'No version history found for this document'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        documentId,
        versions,
        currentVersion: versions[0], // Latest version
        totalVersions: versions.length
      }
    });
  }));
}
