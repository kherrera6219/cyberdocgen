import { Router, Response, NextFunction } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { db } from '../db';
import { documents, documentApprovals, gapAnalysisReports, companyProfiles } from '@shared/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { secureHandler } from '../utils/errorHandling';
import { type MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';

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
  router.get('/documents', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { status, framework, limit = 50, offset = 0 } = req.query;
    const organizationId = req.organizationId!;

    // Build query with optional filters
    let query = db.select({ documents }).from(documents)
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id));

    // Apply organization filter
    let whereClause = eq(companyProfiles.organizationId, organizationId);

    // Apply tags/framework if provided
    if (status) {
      whereClause = and(whereClause, eq(documents.status, status as string)) as any;
    }
    if (framework) {
      whereClause = and(whereClause, eq(documents.framework, framework as string)) as any;
    }

    query = query.where(whereClause) as any;

    // Get documents with pagination
    const documentsList = await query
      .orderBy(desc(documents.updatedAt))
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10))
      .then(results => results.map(r => r.documents));

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(documents)
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(eq(companyProfiles.organizationId, organizationId));

    res.json({
      success: true,
      data: {
        documents: documentsList,
        pagination: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          hasMore: parseInt(offset as string, 10) + documentsList.length < total
        }
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
  router.get('/overview', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;

    // Get document statistics by status
    const documentStats = await db
      .select({
        status: documents.status,
        count: count()
      })
      .from(documents)
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(eq(companyProfiles.organizationId, organizationId))
      .groupBy(documents.status);

    // Get approval statistics
    const approvalStats = await db
      .select({
        status: documentApprovals.status,
        count: count()
      })
      .from(documentApprovals)
      .innerJoin(documents, eq(documentApprovals.documentId, documents.id))
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(eq(companyProfiles.organizationId, organizationId))
      .groupBy(documentApprovals.status);

    // Get gap analysis reports count
    const [{ gapReportsCount }] = await db
      .select({ gapReportsCount: count() })
      .from(gapAnalysisReports)
      .where(eq(gapAnalysisReports.organizationId, organizationId));

    // Get documents by framework
    const frameworkStats = await db
      .select({
        framework: documents.framework,
        count: count()
      })
      .from(documents)
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(eq(companyProfiles.organizationId, organizationId))
      .groupBy(documents.framework);

    // Calculate overall compliance percentage (documents with status 'approved')
    const totalDocs = documentStats.reduce((sum, stat) => sum + stat.count, 0);
    const approvedDocs = documentStats.find(s => s.status === 'approved')?.count || 0;
    const compliancePercentage = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

    res.json({
      success: true,
      data: {
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
  router.get('/export', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { format = 'json', framework } = req.query;
    const organizationId = req.organizationId!;

    // Get all documents
    let whereClause = eq(companyProfiles.organizationId, organizationId);
    if (framework) {
      whereClause = and(whereClause, eq(documents.framework, framework as string)) as any;
    }

    const allDocuments = await db.select({ documents }).from(documents)
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(whereClause)
      .orderBy(desc(documents.updatedAt))
      .then(results => results.map(r => r.documents));

    // Get all approvals
    const allApprovals = await db
      .select({ document_approvals: documentApprovals })
      .from(documentApprovals)
      .innerJoin(documents, eq(documentApprovals.documentId, documents.id))
      .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
      .where(eq(companyProfiles.organizationId, organizationId))
      .orderBy(desc(documentApprovals.createdAt))
      .then(results => results.map(r => r.document_approvals));

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
        data: {
          message: `Export format '${format}' not yet implemented, returning JSON`,
          ...exportData
        }
      });
    }
  }));

  app.use('/api/auditor', router);
}
