import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { type RemediationRecommendation } from '@shared/schema';
import { validateBody } from '../middleware/routeValidation';
import { gapAnalysisGenerateSchema, updateRecommendationSchema } from '../validation/schemas';

export function registerGapAnalysisRoutes(router: Router) {
  /**
   * @openapi
   * /api/gap-analysis:
   *   get:
   *     tags: [Gap Analysis]
   *     summary: Get gap analysis reports
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Gap analysis reports retrieved
   *       401:
   *         description: Unauthorized
   */
  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userOrganizations = await storage.getUserOrganizations(userId);

      if (userOrganizations.length === 0) {
        return res.json([]);
      }

      const organizationId = userOrganizations[0].organizationId;
      const reports = await storage.getGapAnalysisReports(organizationId);

      res.json(reports);
    } catch (error) {
      logger.error("Error fetching gap analysis reports", {
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to fetch gap analysis reports" });
    }
  });

  /**
   * @openapi
   * /api/gap-analysis/{framework}:
   *   get:
   *     tags: [Gap Analysis]
   *     summary: Get gap analysis by framework
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: framework
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Gap analysis for framework retrieved
   *       401:
   *         description: Unauthorized
   */
  router.get("/:framework", isAuthenticated, async (req: any, res) => {
    try {
      const { framework } = req.params;
      const userId = req.user.claims.sub;
      const userOrganizations = await storage.getUserOrganizations(userId);

      if (userOrganizations.length === 0) {
        return res.json([]);
      }

      const organizationId = userOrganizations[0].organizationId;
      const reports = await storage.getGapAnalysisReports(organizationId);

      // Filter by framework
      const frameworkReports = reports.filter(r => r.framework === framework);
      res.json(frameworkReports);
    } catch (error) {
      logger.error("Error fetching gap analysis by framework", {
        error: error instanceof Error ? error.message : String(error),
        framework: req.params.framework
      }, req);
      res.status(500).json({ message: "Failed to fetch gap analysis by framework" });
    }
  });

  /**
   * @openapi
   * /api/gap-analysis:
   *   post:
   *     tags: [Gap Analysis]
   *     summary: Create a new gap analysis
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - framework
   *               - companyProfileId
   *             properties:
   *               framework:
   *                 type: string
   *               companyProfileId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Gap analysis created
   *       401:
   *         description: Unauthorized
   */
  router.post("/", isAuthenticated, async (req: any, res) => {
    // This endpoint is an alias for /generate
    // Forward to the generate handler below
    try {
      const userId = req.user.claims.sub;
      const { framework, companyProfileId } = req.body;

      if (!framework) {
        return res.status(400).json({ message: "Framework is required" });
      }

      const userOrganizations = await storage.getUserOrganizations(userId);
      if (userOrganizations.length === 0) {
        return res.status(400).json({ message: "User not associated with any organization" });
      }

      const organizationId = userOrganizations[0].organizationId;

      // For now, return a simple response indicating the route requires authentication
      // Full implementation would mirror the /generate endpoint
      res.status(501).json({ message: "Gap analysis generation not yet implemented for this endpoint. Use /api/gap-analysis/generate instead." });
    } catch (error) {
      logger.error("Error creating gap analysis", {
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to create gap analysis" });
    }
  });

  router.get("/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userOrganizations = await storage.getUserOrganizations(userId);
      
      if (userOrganizations.length === 0) {
        return res.json([]);
      }

      const organizationId = userOrganizations[0].organizationId;
      const reports = await storage.getGapAnalysisReports(organizationId);
      
      res.json(reports);
    } catch (error) {
      logger.error("Error fetching gap analysis reports", { 
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  router.get("/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getGapAnalysisReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const findings = await storage.getGapAnalysisFindings(id);
      const recommendations = [];
      
      for (const finding of findings) {
        const findingRecommendations = await storage.getRemediationRecommendations(finding.id);
        recommendations.push(...findingRecommendations);
      }

      const maturityAssessment = await storage.getComplianceMaturityAssessment(
        report.organizationId, 
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
        report,
        findings,
        recommendations,
        maturityAssessment,
        executiveSummary
      });
    } catch (error) {
      logger.error("Error fetching gap analysis report details", { 
        reportId: req.params.id,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to fetch report details" });
    }
  });

  router.post("/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { framework, includeMaturityAssessment, focusAreas } = req.body;
      
      const userOrganizations = await storage.getUserOrganizations(userId);
      if (userOrganizations.length === 0) {
        return res.status(400).json({ message: "User not associated with any organization" });
      }

      const organizationId = userOrganizations[0].organizationId;
      const companyProfiles = await storage.getCompanyProfiles(organizationId);
      
      if (companyProfiles.length === 0) {
        return res.status(400).json({ message: "No company profile found" });
      }

      const companyProfile = companyProfiles[0];

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
        message: "Gap analysis started",
        reportId: report.id
      });
    } catch (error) {
      logger.error("Error starting gap analysis", { 
        framework: req.body.framework,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to start gap analysis" });
    }
  });

  router.patch("/recommendations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updates: Partial<RemediationRecommendation> = { status };
      if (status === 'completed') {
        updates.completedDate = new Date();
      }

      const recommendation = await storage.updateRemediationRecommendation(id, updates);
      
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json(recommendation);
    } catch (error) {
      logger.error("Error updating recommendation", { 
        recommendationId: req.params.id,
        error: error instanceof Error ? error.message : String(error)
      }, req);
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });
}
