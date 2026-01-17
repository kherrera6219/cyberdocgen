import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { type RemediationRecommendation } from '@shared/schema';
import { 
  secureHandler, 
  ValidationError,
  NotFoundError
} from '../utils/errorHandling';
import { type MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';

export function registerGapAnalysisRoutes(router: Router) {
  /**
   * Get gap analysis reports
   */
  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const reports = await storage.getGapAnalysisReports(organizationId);

    res.json({ success: true, data: reports });
  }));

  /**
   * Get gap analysis by framework
   */
  router.get("/:framework", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { framework } = req.params;
    const organizationId = req.organizationId!;
    const reports = await storage.getGapAnalysisReports(organizationId);

    // Filter by framework
    const frameworkReports = reports.filter(r => r.framework === framework);
    res.json({ success: true, data: frameworkReports });
  }));

  /**
   * Create a new gap analysis
   */
  router.post("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { framework } = req.body;

    if (!framework) {
      throw new ValidationError("Framework is required");
    }

    res.status(501).json({ 
      success: false, 
      error: { 
        code: 'NOT_IMPLEMENTED',
        message: "Gap analysis generation not yet implemented for this endpoint. Use /api/gap-analysis/generate instead." 
      }
    });
  }));

  /**
   * Get gap analysis reports (alias)
   */
  router.get("/reports", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const reports = await storage.getGapAnalysisReports(organizationId);
    
    res.json({ success: true, data: reports });
  }));

  /**
   * Get gap analysis report details
   */
  router.get("/reports/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const report = await storage.getGapAnalysisReport(id);
    
    if (!report || report.organizationId !== organizationId) {
      throw new NotFoundError("Report not found");
    }

    const findings = await storage.getGapAnalysisFindings(id);
    const recommendations = [];
    
    for (const finding of findings) {
      const findingRecommendations = await storage.getRemediationRecommendations(finding.id);
      recommendations.push(...findingRecommendations);
    }

    const maturityAssessment = await storage.getComplianceMaturityAssessment(
      organizationId, 
      report.framework
    );

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
      success: true,
      data: {
        report,
        findings,
        recommendations,
        maturityAssessment,
        executiveSummary
      }
    });
  }, { audit: { action: 'view', entityType: 'gapAnalysisReport', getEntityId: (req) => req.params.id } }));

  /**
   * Generate gap analysis
   */
  router.post("/generate", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { framework, includeMaturityAssessment, focusAreas } = req.body;
    
    const companyProfiles = await storage.getCompanyProfiles(organizationId);
    
    if (companyProfiles.length === 0) {
      throw new ValidationError("No company profile found. Please create a company profile first.");
    }

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

    // Background processing
    setTimeout(async () => {
      try {
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

        for (const findingData of mockFindings) {
          const finding = await storage.createGapAnalysisFinding(findingData);
          
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

        const overallScore = Math.round(
          mockFindings.reduce((sum, f) => sum + f.complianceScore, 0) / mockFindings.length
        );

        await storage.updateGapAnalysisReport(report.id, {
          status: 'completed',
          overallScore
        });

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
                implemented: mockFindings.filter(f => f.currentStatus === 'implemented').length
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

        logger.info('Gap analysis completed', { reportId: report.id, overallScore });
      } catch (error) {
        logger.error("Error in gap analysis background processing", { 
          reportId: report.id,
          error: error instanceof Error ? error.message : String(error)
        });
        
        await storage.updateGapAnalysisReport(report.id, {
          status: 'failed'
        });
      }
    }, 2000);

    res.json({ 
      success: true,
      data: {
        message: "Gap analysis started",
        reportId: report.id
      }
    });
  }, { audit: { action: 'create', entityType: 'gapAnalysis' } }));

  /**
   * Update recommendation status
   */
  router.patch("/recommendations/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.organizationId!;
    
    const recommendation = await storage.getRemediationRecommendation(id);
    if (!recommendation) {
      throw new NotFoundError("Recommendation not found");
    }
    
    // Validate ownership via finding then report
    const finding = await storage.getGapAnalysisFinding(recommendation.findingId);
    if (!finding) {
        throw new NotFoundError("Recommendation finding not found");
    }
    const report = await storage.getGapAnalysisReport(finding.reportId);
    if (!report || report.organizationId !== organizationId) {
      throw new NotFoundError("Recommendation not found");
    }

    const updates: Partial<RemediationRecommendation> = { status };
    if (status === 'completed') {
      updates.completedDate = new Date();
    }

    const updated = await storage.updateRemediationRecommendation(id, updates);

    res.json({ success: true, data: updated });
  }, { audit: { action: 'update', entityType: 'recommendation', getEntityId: (req) => req.params.id } }));
}
