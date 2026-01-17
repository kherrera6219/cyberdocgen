import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { documents, documentApprovals, gapAnalysisReports } from '@shared/schema';
import { eq, desc, count } from 'drizzle-orm';
import { asyncHandler } from '../utils/routeHelpers';

export function registerAuditorRoutes(app: Router) {
  const router = Router();

  /**
   * @openapi
   * /api/auditor/documents:
   *   get:
   *     tags: [Auditor]
   *     summary: Get documents for auditor workspace
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of documents for audit
   *       401:
   *         description: Unauthorized
   */
  router.get('/documents', isAuthenticated, asyncHandler(async (req, res) => {
    const { status, framework, limit = 50, offset = 0 } = req.query;

    // Build query with optional filters
    let query = db.select().from(documents);

    // Apply filters if provided
    if (status) {
      query = query.where(eq(documents.status, status as string)) as any;
    }
    if (framework) {
      query = query.where(eq(documents.framework, framework as string)) as any;
    }

    // Get documents with pagination
    const documentsList = await query
      .orderBy(desc(documents.updatedAt))
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10));

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(documents);

    res.json({
      success: true,
      documents: documentsList,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + documentsList.length < total
      }
    });
  }));

  /**
   * @openapi
   * /api/auditor/overview:
   *   get:
   *     tags: [Auditor]
   *     summary: Get compliance overview for auditor
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Compliance overview
   *       401:
   *         description: Unauthorized
   */
  router.get('/overview', isAuthenticated, asyncHandler(async (req, res) => {
    // Get document statistics by status
    const documentStats = await db
      .select({
        status: documents.status,
        count: count()
      })
      .from(documents)
      .groupBy(documents.status);

    // Get approval statistics
    const approvalStats = await db
      .select({
        status: documentApprovals.status,
        count: count()
      })
      .from(documentApprovals)
      .groupBy(documentApprovals.status);

    // Get gap analysis reports count
    const [{ gapReportsCount }] = await db
      .select({ gapReportsCount: count() })
      .from(gapAnalysisReports);

    // Get documents by framework
    const frameworkStats = await db
      .select({
        framework: documents.framework,
        count: count()
      })
      .from(documents)
      .groupBy(documents.framework);

    // Calculate overall compliance percentage (documents with status 'approved')
    const totalDocs = documentStats.reduce((sum, stat) => sum + stat.count, 0);
    const approvedDocs = documentStats.find(s => s.status === 'approved')?.count || 0;
    const compliancePercentage = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

    res.json({
      success: true,
      overview: {
        compliancePercentage,
        totalDocuments: totalDocs,
        documentsByStatus: documentStats,
        approvalsByStatus: approvalStats,
        gapAnalysisReports: gapReportsCount,
        documentsByFramework: frameworkStats
      }
    });
  }));

  /**
   * @openapi
   * /api/auditor/export:
   *   get:
   *     tags: [Auditor]
   *     summary: Export audit reports
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Audit report exported
   *       401:
   *         description: Unauthorized
   */
  router.get('/export', isAuthenticated, asyncHandler(async (req, res) => {
    const { format = 'json', framework } = req.query;

    // Get all documents
    let query = db.select().from(documents);
    if (framework) {
      query = query.where(eq(documents.framework, framework as string)) as any;
    }

    const allDocuments = await query.orderBy(desc(documents.updatedAt));

    // Get all approvals
    const allApprovals = await db
      .select()
      .from(documentApprovals)
      .orderBy(desc(documentApprovals.createdAt));

    // Generate export data
    const exportData = {
      exportDate: new Date().toISOString(),
      framework: framework || 'All',
      documents: allDocuments,
      approvals: allApprovals,
      summary: {
        totalDocuments: allDocuments.length,
        totalApprovals: allApprovals.length,
        documentsByStatus: allDocuments.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Return based on format
    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      // For other formats (CSV, PDF), return JSON for now
      // Can be extended to generate actual CSV/PDF
      res.json({
        success: true,
        message: `Export format '${format}' not yet implemented, returning JSON`,
        data: exportData
      });
    }
  }));

  app.use('/api/auditor', router);
}
