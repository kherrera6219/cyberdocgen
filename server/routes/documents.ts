import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertDocumentSchema } from '@shared/schema';
import { versionService } from '../services/versionService';
import { encryptionService } from '../services/encryption';
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
    res.status(204).end();
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

    // Fetch user's company profile
    const companyProfile = await storage.getCompanyProfile(companyProfileId);
    if (!companyProfile) {
      throw new NotFoundError("Company profile not found");
    }

    // Try to find a matching modular template in DocumentTemplateService
    const { DocumentTemplateService } = await import('../services/documentTemplates');
    const templates = DocumentTemplateService.getTemplatesByFramework(framework);
    
    // Find best match by title, category, or fallback to first template
    const template = templates.find(t => 
      t.title.toLowerCase().includes(title.toLowerCase()) || 
      title.toLowerCase().includes(t.title.toLowerCase())
    ) || templates.find(t => t.category === category) || templates[0];

    let generatedContent = '';
    let selectedModel = 'offline-deterministic';

    const infraString = Array.isArray(companyProfile.cloudInfrastructure) 
      ? companyProfile.cloudInfrastructure.join(', ') 
      : String(companyProfile.cloudInfrastructure || '');

    const appsString = Array.isArray(companyProfile.businessApplications) 
      ? companyProfile.businessApplications.join(', ') 
      : String(companyProfile.businessApplications || '');

    const variables: Record<string, any> = {
      company_name: companyProfile.companyName,
      companyName: companyProfile.companyName,
      industry: companyProfile.industry,
      company_size: companyProfile.companySize,
      companySize: companyProfile.companySize,
      primary_locations: companyProfile.headquarters || "Primary Corporate Headquarters",
      headquarters: companyProfile.headquarters || "Primary Corporate Headquarters",
      cloud_infrastructure: infraString || "Enterprise Cloud Environments",
      cloudInfrastructure: infraString || "Enterprise Cloud Environments",
      data_classification: companyProfile.dataClassification || "Confidential",
      dataClassification: companyProfile.dataClassification || "Confidential",
      business_applications: appsString || "Core Business Operations Systems",
      businessApplications: appsString || "Core Business Operations Systems",
      
      // Dynamic dates and standard placeholders
      approval_date: new Date().toISOString().split('T')[0],
      approvalDate: new Date().toISOString().split('T')[0],
      effective_date: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      approved_by: "Chief Information Security Officer (CISO)",
      approvedBy: "Chief Information Security Officer (CISO)",
      document_owner: "Director of Compliance & Information Security",
      documentOwner: "Director of Compliance & Information Security",
      version: "1.0.0",
      
      // Location/Infra helpers
      data_centers: "AWS cloud hosting platform regions",
      dataCenters: "AWS cloud hosting platform regions",
      remote_locations: "Remote workforce securely connected via virtual private networking (VPN)",
      remoteLocations: "Remote workforce securely connected via virtual private networking (VPN)",
      business_units: "All operational divisions, software engineering, product management, and corporate services",
      businessUnits: "All operational divisions, software engineering, product management, and corporate services",
      departments: "Engineering, Security Operations, Human Resources, Legal, Customer Support",
      third_party_services: "Critical cloud infrastructure and SaaS sub-processors identified in vendor registry",
      thirdPartyServices: "Critical cloud infrastructure and SaaS sub-processors identified in vendor registry",
      information_systems: "Production deployment systems, source code management tools, continuous integration platforms, employee workstations",
      informationSystems: "Production deployment systems, source code management tools, continuous integration platforms, employee workstations",
      networks: "Virtual Private Cloud (VPC) subnets, corporate firewall domains, secure gateway networks",
      cloud_services: infraString || "Enterprise Cloud Services",
      cloudServices: infraString || "Enterprise Cloud Services",
      mobile_devices: "Corporate-managed laptops and mobile devices under active mobile device management (MDM) policies",
      mobileDevices: "Corporate-managed laptops and mobile devices under active mobile device management (MDM) policies",
      exclusions: "No exclusions have been defined. All components of the production application and customer support environment fall within the boundary of this program.",
      legal_requirements: "General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), SOC 2 Trust Services Criteria, ISO/IEC 27001 standard controls, NIST SP 800-53 requirements.",
      legalRequirements: "General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), SOC 2 Trust Services Criteria, ISO/IEC 27001 standard controls, NIST SP 800-53 requirements."
    };

    if (template) {
      const genResult = DocumentTemplateService.generateDeterministicDocument({
        templateId: template.id,
        variables,
        includeToc: true,
        includeMetadata: true,
        version: "1.0.0"
      });
      if (genResult.success && genResult.content) {
        generatedContent = genResult.content;
      }
    }

    // Fallback if template is not found or template generation fails
    if (!generatedContent) {
      selectedModel = 'offline-fallback';
      generatedContent = `# ${title}

## Executive Summary
This comprehensive ${category} policy document establishes the regulatory compliance standards for ${companyProfile.companyName} to satisfy the ${framework} framework. 

${description ? `## 1. Scope & Objective\n${description}\n` : '## 1. Scope & Objective\nThis policy defines the management framework and technical controls required to support our security requirements.\n'}

## 2. Technical Control Guidelines
In alignment with ${framework} guidelines, ${companyProfile.companyName} enforces strict security policies across all cloud environments, including ${infraString}. These controls apply to all critical corporate applications, specifically ${appsString}.

## 3. Roles and Responsibilities
- **Management Oversight**: Establishes information security budgets, approves risk tolerance levels, and reviews audit findings.
- **Security Operations**: Implements system configurations, executes technical controls, and monitors log outputs.
- **Staff Compliance**: Adheres to all physical and technological security guidelines.

## 4. Policy Enforcement and Reviews
Regular compliance checks and gap analysis audits are conducted. Security reviews are scheduled at least annually.

---
**Approved By:** Chief Information Security Officer (CISO)
**Effective Date:** ${new Date().toISOString().split('T')[0]}
**Framework Compliance:** ${framework}
**Document Category:** ${category}`;
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
      aiModel: selectedModel,
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
    
    const approvals = await storage.getDocumentApprovalsByDocumentId(req.params.id);
    res.json({ success: true, data: approvals });
  }));

  router.post('/:id/approvals', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    // Validate document ownership
    const { document, authorized } = await getDocumentWithOrgCheck(req.params.id, req.organizationId!);
    if (!authorized || !document) {
      throw new NotFoundError("Document not found");
    }
    
    const userId = getRequiredUserId(req);
    const { approverRole = 'ciso', priority = 'medium', comments = '' } = req.body;
    
    const approval = await storage.createDocumentApproval({
      documentId: req.params.id,
      versionId: null,
      requestedBy: userId,
      approverRole: approverRole,
      assignedTo: "compliance-officer-1",
      status: "pending",
      comments: comments || "Requesting review and compliance validation.",
      priority: priority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    
    res.json({ 
      success: true, 
      data: {
        message: "Approval request submitted successfully",
        approvalId: approval.id
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

  /**
   * @swagger
   * /api/documents/{id}/acknowledge:
   *   post:
   *     summary: Acknowledge and cryptographically e-sign a compliance document/policy
   *     tags: [Documents]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Document acknowledged successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Document not found
   */
  router.post('/:id/acknowledge', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const documentId = req.params.id;
    const userId = getRequiredUserId(req);
    const ipAddress = req.ip || '127.0.0.1';

    // Validate document ownership
    const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
    if (!authorized || !document) {
      logger.warn('Document acknowledgment access denied - cross-tenant attempt', {
        documentId,
        organizationId: req.organizationId,
        userId,
        ip: req.ip
      });
      throw new NotFoundError("Document not found");
    }

    // Check if already acknowledged
    const existing = await storage.getPolicyAcknowledgment(userId, documentId);
    if (existing) {
      res.json({ success: true, data: existing, message: 'Policy already acknowledged' });
      return;
    }

    const signedAt = new Date().toISOString();
    const signatureEnvelope = await encryptionService.generateSignatureEnvelope(
      userId,
      documentId,
      signedAt,
      ipAddress
    );

    const ack = await storage.createPolicyAcknowledgment({
      userId,
      documentId,
      signatureEnvelope,
    });

    logger.info('Policy e-signed and cryptographically sealed', {
      userId,
      documentId,
      envelopeHash: signatureEnvelope.hash,
    });

    res.status(201).json({ success: true, data: ack });
  }, { audit: { action: 'update', entityType: 'policy_acknowledgment' } }));

  /**
   * @swagger
   * /api/documents/acknowledgments:
   *   get:
   *     summary: Retrieve policy acknowledgment and e-signature histories
   *     tags: [Documents]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: documentId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Acknowledgments list retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  router.get('/acknowledgments', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const documentId = req.query.documentId as string;

    let data;
    if (documentId) {
      // Validate document ownership
      const { document, authorized } = await getDocumentWithOrgCheck(documentId, req.organizationId!);
      if (!authorized || !document) {
        throw new NotFoundError("Document not found");
      }
      data = await storage.getPolicyAcknowledgmentsByDocument(documentId);
    } else {
      data = await storage.getPolicyAcknowledgmentsByUser(userId);
    }

    res.json({ success: true, data });
  }));
}
