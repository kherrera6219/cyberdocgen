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
import { complianceGapAnalysisService } from '../services/complianceGapAnalysis';

export function registerGapAnalysisRoutes(router: Router) {
  /**
   * Update recommendation status
   */
  router.patch("/recommendations/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    // Handler content (restored from below)
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

  /**
   * Get gap analysis reports
   */
  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const reports = await storage.getGapAnalysisReports(organizationId);

    res.json({ success: true, data: reports });
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
    const allRecommendations = await Promise.all(
      findings.map(f => storage.getRemediationRecommendations(f.id))
    );
    const recommendations = allRecommendations.flat();

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
    setTimeout(() => {
      (async () => {
        try {
          const profile = companyProfiles[0];
          const result = await complianceGapAnalysisService.analyzeComplianceGaps(
            organizationId,
            profile,
            {
              framework,
              includeMaturityAssessment: !!includeMaturityAssessment,
              focusAreas: focusAreas || []
            }
          );

          // Save findings and recommendations in the database
          for (const findingData of result.findings) {
            const finding = await storage.createGapAnalysisFinding({
              reportId: report.id,
              controlId: findingData.controlId,
              controlTitle: findingData.controlTitle,
              currentStatus: findingData.currentStatus,
              riskLevel: findingData.riskLevel,
              gapDescription: findingData.gapDescription,
              businessImpact: findingData.businessImpact,
              evidenceRequired: findingData.evidenceRequired || 'Documentation and evidence of implementation',
              complianceScore: findingData.complianceScore,
              priority: findingData.priority,
              estimatedEffort: findingData.estimatedEffort
            });
            
            // Save associated recommendations
            const associatedRecs = result.recommendations.filter(r => r.findingId === findingData.id || r.findingId === '');
            for (const rec of associatedRecs) {
              await storage.createRemediationRecommendation({
                findingId: finding.id,
                title: rec.title,
                description: rec.description,
                implementation: rec.implementation,
                resources: rec.resources,
                timeframe: rec.timeframe,
                cost: rec.cost,
                priority: rec.priority,
                status: 'pending',
                assignedTo: null,
                dueDate: null,
                completedDate: null
              });
            }
          }

          // Update report to complete with overall score
          await storage.updateGapAnalysisReport(report.id, {
            status: 'completed',
            overallScore: result.report.overallScore ?? 0,
            metadata: result.report.metadata
          });

          // Save maturity assessment if generated
          if (includeMaturityAssessment && result.maturityAssessment) {
            await storage.createComplianceMaturityAssessment({
              organizationId,
              framework: result.maturityAssessment.framework,
              maturityLevel: result.maturityAssessment.maturityLevel,
              assessmentData: result.maturityAssessment.assessmentData,
              recommendations: result.maturityAssessment.recommendations,
              nextReviewDate: result.maturityAssessment.nextReviewDate
            });
          }

          logger.info('Gap analysis completed dynamically', { reportId: report.id, overallScore: result.report.overallScore });
        } catch (error) {
          logger.error("Error in gap analysis background processing", { 
            reportId: report.id,
            error: error instanceof Error ? error.message : String(error)
          });
          
          try {
            await storage.updateGapAnalysisReport(report.id, { status: 'failed' });
          } catch (updateError) {
            logger.error("Failed to mark gap analysis report as failed", {
              reportId: report.id,
              error: updateError instanceof Error ? updateError.message : String(updateError)
            });
          }
        }
      })().catch((fatalError) => {
        logger.error("Gap analysis background task fatal error", {
          reportId: report.id,
          error: fatalError instanceof Error ? fatalError.message : String(fatalError)
        });
      });
    }, 2000);

    res.json({ 
      success: true,
      data: {
        message: "Gap analysis started",
        reportId: report.id
      }
    });
  }, { audit: { action: 'create', entityType: 'gapAnalysis' } }));

}
