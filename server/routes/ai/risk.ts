// AI Risk Assessment Routes
// Risk analysis and threat modeling
import { Router } from 'express';
import { storage } from '../../storage';
import { riskAssessmentService } from '../../services/riskAssessment';
import {
  isAuthenticated,
  getRequiredUserId,
  asyncHandler,
  ValidationError,
  validateBody,
  aiLimiter,
  validateAIRequestSize,
  auditService
} from './shared';
import { riskAssessmentSchema, threatAnalysisSchema } from '../../validation/requestSchemas';

export function registerRiskRoutes(router: Router) {
  /**
   * POST /api/ai/risk-assessment
   * Assess organizational risk based on profile and docs
   */
  router.post("/risk-assessment", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(riskAssessmentSchema), asyncHandler(async (req, res) => {
    const { frameworks, includeDocuments } = req.body;
    const userId = getRequiredUserId(req);

    const companyProfile = await storage.getCompanyProfile(userId);
    if (!companyProfile) {
      throw new ValidationError("Company profile is required for risk assessment");
    }

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
      userId: req.user?.claims?.sub || getRequiredUserId(req).toString(),
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      metadata: { frameworks, includeDocuments }
    });

    res.json(assessment);
  }));

  /**
   * POST /api/ai/threat-analysis
   * Analyze threat landscape for industry
   */
  router.post("/threat-analysis", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(threatAnalysisSchema), asyncHandler(async (req, res) => {
    const { industry, companySize, frameworks } = req.body;

    const threatAnalysis = await riskAssessmentService.analyzeThreatLandscape(
      industry,
      companySize,
      frameworks
    );
    
    await auditService.logAction({
      action: "analyze",
      entityType: "threat_landscape",
      entityId: `threat_${Date.now()}`,
      userId: req.user?.claims?.sub || getRequiredUserId(req).toString(),
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      metadata: { industry, companySize, frameworks }
    });

    res.json(threatAnalysis);
  }));
}
