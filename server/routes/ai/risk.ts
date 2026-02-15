// AI Risk Assessment Routes
// Risk analysis and threat modeling
import { Router, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { riskAssessmentService } from '../../services/riskAssessment';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
  AppError,
  ValidationError,
  validateInput,
  requireOrganization,
  type MultiTenantRequest,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  crypto
} from './shared';
import { riskAssessmentSchema, threatAnalysisSchema } from '../../validation/requestSchemas';
import { aiUsageAccountingService } from '../../services/aiUsageAccountingService';
import { aiOutputClassificationService } from '../../services/aiOutputClassificationService';
import { aiMetadataAuditService } from '../../services/aiMetadataAuditService';
import { promptTemplateRegistry } from '../../services/promptTemplateRegistry';

export function registerRiskRoutes(router: Router) {
  /**
   * POST /api/ai/risk-assessment
   * Assess organizational risk based on profile and docs
   */
  router.post("/risk-assessment", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(riskAssessmentSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { frameworks, includeDocuments } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    // Get primary company profile for this organization
    const profiles = await storage.getCompanyProfiles(organizationId);
    const companyProfile = profiles[0];
    
    if (!companyProfile) {
      throw new ValidationError("Company profile is required for risk assessment. Please create one first.");
    }

    const requestId = crypto.randomUUID();
    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: 'Assess organizational compliance risk',
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'risk_assessment',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify({ companyProfile, frameworks, includeDocuments }),
      expectedResponseTokens: 1200,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

    let existingDocuments: string[] = [];
    if (includeDocuments) {
      const documents = await storage.getDocuments(organizationId);
      existingDocuments = documents.map((doc: any) => doc.title);
    }

    const assessment = await riskAssessmentService.assessOrganizationalRisk(
      companyProfile,
      frameworks,
      existingDocuments
    );
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'risk_assessment',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify({ companyProfile, frameworks, existingDocuments }),
      response: JSON.stringify(assessment),
      purposeDescription: 'Assess organizational compliance risk',
      dataUsed: ['company_profile', 'existing_documents', 'frameworks'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'risk_assessment',
      model: 'claude-sonnet-4',
      userId,
      organizationId,
      requestId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(JSON.stringify(assessment)),
      usage,
    });
    
    await auditService.logAction({
      action: "assess",
      entityType: "risk_assessment",
      entityId: `risk_${crypto.randomUUID()}`,
      userId: userId.toString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { frameworks, includeDocuments, organizationId }
    });

    res.json({
      success: true,
      data: assessment
    });
  }));

  /**
   * POST /api/ai/threat-analysis
   * Analyze threat landscape for industry
   */
  router.post("/threat-analysis", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(threatAnalysisSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { industry, companySize, frameworks } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const requestId = crypto.randomUUID();
    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: `Analyze threat landscape for ${industry}`,
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'threat_analysis',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify({ industry, companySize, frameworks }),
      expectedResponseTokens: 1200,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

    const threatAnalysis = await riskAssessmentService.analyzeThreatLandscape(
      industry,
      companySize,
      frameworks
    );
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'threat_analysis',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify({ industry, companySize, frameworks }),
      response: JSON.stringify(threatAnalysis),
      purposeDescription: 'Analyze threat landscape for organization context',
      dataUsed: ['industry', 'company_size', 'frameworks'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'threat_analysis',
      model: 'claude-sonnet-4',
      userId,
      organizationId,
      requestId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(JSON.stringify(threatAnalysis)),
      usage,
    });
    
    await auditService.logAction({
      action: "analyze",
      entityType: "threat_landscape",
      entityId: `threat_${crypto.randomUUID()}`,
      userId: userId.toString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { industry, companySize, frameworks, organizationId }
    });

    res.json({
      success: true,
      data: threatAnalysis
    });
  }));
}
