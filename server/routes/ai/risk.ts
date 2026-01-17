// AI Risk Assessment Routes
// Risk analysis and threat modeling
import { Router, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { riskAssessmentService } from '../../services/riskAssessment';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
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

    const threatAnalysis = await riskAssessmentService.analyzeThreatLandscape(
      industry,
      companySize,
      frameworks
    );
    
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
