import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { documents, companyProfiles, auditLogs, frameworkControlStatuses, gapAnalysisReports } from '@shared/schema';
import { eq, desc, sql, and, gte, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';

export function registerDashboardRoutes(app: Router) {
  const router = Router();

  /**
   * @openapi
   * /api/dashboard/stats:
   *   get:
   *     tags: [Dashboard]
   *     summary: Get dashboard statistics
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *       401:
   *         description: Unauthorized
   */
  router.get('/stats', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';

      // Get company profiles for this organization to scope documents
      const orgProfiles = await db
        .select()
        .from(companyProfiles)
        .where(eq(companyProfiles.organizationId, organizationId));
      
      const profileIds = orgProfiles.map(p => p.id);

      // Get document counts scoped to organization's profiles
      // Short-circuit: if no profiles exist for this org, return empty array (multi-tenant isolation)
      let allDocs: typeof documents.$inferSelect[] = [];
      if (profileIds.length > 0) {
        allDocs = await db
          .select()
          .from(documents)
          .where(inArray(documents.companyProfileId, profileIds));
      }
      
      const completedDocs = allDocs.filter(d => d.status === 'complete');
      const draftDocs = allDocs.filter(d => d.status === 'draft');
      const reviewDocs = allDocs.filter(d => d.status === 'review');
      
      // Get unique frameworks
      const frameworks = [...new Set(allDocs.map(d => d.framework))];
      
      // Calculate framework-specific stats
      const frameworkStats: Record<string, { total: number; completed: number; progress: number }> = {};
      
      const frameworkTargets: Record<string, number> = {
        'ISO27001': 14,
        'SOC2': 12,
        'FEDRAMP': 15,
        'NIST': 10
      };
      
      for (const framework of Object.keys(frameworkTargets)) {
        const frameworkDocs = allDocs.filter(d => d.framework === framework);
        const frameworkCompleted = frameworkDocs.filter(d => d.status === 'complete').length;
        const target = frameworkTargets[framework];
        frameworkStats[framework] = {
          total: frameworkDocs.length,
          completed: frameworkCompleted,
          progress: Math.round((frameworkCompleted / target) * 100)
        };
      }

      // Get control statuses scoped to organization
      const controlStatuses = await db
        .select()
        .from(frameworkControlStatuses)
        .where(eq(frameworkControlStatuses.organizationId, organizationId));
      
      const controlStats = {
        total: controlStatuses.length,
        implemented: controlStatuses.filter(c => c.status === 'implemented').length,
        inProgress: controlStatuses.filter(c => c.status === 'in_progress').length,
        notStarted: controlStatuses.filter(c => c.status === 'not_started').length
      };

      // Calculate overall compliance score
      const totalDocProgress = Object.values(frameworkStats).reduce((acc, f) => acc + f.progress, 0);
      const overallScore = Math.round(totalDocProgress / Object.keys(frameworkStats).length);

      res.json({
        success: true,
        stats: {
          documents: {
            total: allDocs.length,
            completed: completedDocs.length,
            draft: draftDocs.length,
            review: reviewDocs.length,
            completionRate: allDocs.length > 0 ? Math.round((completedDocs.length / allDocs.length) * 100) : 0
          },
          frameworks: {
            active: frameworks.length,
            stats: frameworkStats
          },
          controls: controlStats,
          compliance: {
            overallScore,
            trend: 'up' // This would be calculated from historical data
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve dashboard statistics' });
    }
  });

  /**
   * @openapi
   * /api/dashboard/activity:
   *   get:
   *     tags: [Dashboard]
   *     summary: Get recent activity feed
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Recent activity feed
   *       401:
   *         description: Unauthorized
   */
  router.get('/activity', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      // Get recent audit logs scoped to organization
      const recentActivity = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.organizationId, organizationId))
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit);

      // Transform to activity feed format
      const activities = recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        userId: log.userId,
        timestamp: log.timestamp,
        details: log.newValues
      }));

      res.json({
        success: true,
        activities,
        count: activities.length
      });
    } catch (error) {
      logger.error('Failed to get dashboard activity', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve activity feed' });
    }
  });

  /**
   * @openapi
   * /api/dashboard/compliance-trend:
   *   get:
   *     tags: [Dashboard]
   *     summary: Get compliance score trend over time
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Compliance trend data
   *       401:
   *         description: Unauthorized
   */
  router.get('/compliance-trend', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';

      // Get gap analysis reports scoped to organization
      const reports = await db
        .select()
        .from(gapAnalysisReports)
        .where(eq(gapAnalysisReports.organizationId, organizationId))
        .orderBy(desc(gapAnalysisReports.createdAt))
        .limit(30);

      // Calculate trend data points
      const trendData = reports.map(report => ({
        date: report.createdAt,
        score: report.overallScore || 0,
        framework: report.framework
      }));

      res.json({
        success: true,
        trend: trendData
      });
    } catch (error) {
      logger.error('Failed to get compliance trend', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve compliance trend' });
    }
  });

  app.use('/api/dashboard', router);
}
