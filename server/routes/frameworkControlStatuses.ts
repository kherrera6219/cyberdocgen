import { Router, Response, NextFunction } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { db } from '../db';
import { frameworkControlStatuses } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { 
  secureHandler,
  ValidationError
} from '../utils/errorHandling';
import { type MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';

export function registerFrameworkControlStatusesRoutes(app: Router) {
  const router = Router();

  /**
   * Get all control statuses for a framework
   */
  router.get('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const framework = req.query.framework as string;

    if (!framework) {
      throw new ValidationError('Framework parameter is required');
    }

    const statuses = await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          sql`${frameworkControlStatuses.framework} = ${framework.toLowerCase()}`
        )
      )
      .orderBy(frameworkControlStatuses.controlId);

    // Convert to a map for easier client-side usage
    const statusMap: Record<string, typeof statuses[0]> = {};
    statuses.forEach(s => {
      statusMap[s.controlId] = s;
    });

    res.json({
      success: true,
      data: {
        framework,
        statuses: statusMap,
        count: statuses.length
      }
    });
  }));

  /**
   * Update or create a control status
   */
  router.put('/:controlId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { controlId } = req.params;
    const { framework, status, evidenceStatus, notes } = req.body;

    if (!framework || !status) {
      throw new ValidationError('Framework and status are required');
    }

    // Check if status exists
    const existingList = await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          sql`${frameworkControlStatuses.framework} = ${framework.toLowerCase()}`,
          eq(frameworkControlStatuses.controlId, controlId)
        )
      )
      .limit(1);

    const existing = existingList[0];
    let result;
    if (existing) {
      [result] = await db
        .update(frameworkControlStatuses)
        .set({
          status,
          evidenceStatus: evidenceStatus || existing.evidenceStatus,
          notes: notes !== undefined ? notes : existing.notes,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(frameworkControlStatuses.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(frameworkControlStatuses)
        .values({
          organizationId,
          framework: framework.toLowerCase() as any,
          controlId,
          status,
          evidenceStatus: evidenceStatus || 'none',
          notes: notes || null,
          updatedBy: userId
        })
        .returning();
    }

    res.json({
      success: true,
      data: {
        controlStatus: result,
        message: 'Control status updated successfully'
      }
    });
  }, { audit: { action: 'update', entityType: 'controlStatus', getEntityId: (req) => req.params.controlId } }));

  /**
   * Bulk update control statuses
   */
  router.post('/bulk', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { framework, updates } = req.body;

    if (!framework || !Array.isArray(updates)) {
      throw new ValidationError('Framework and updates array are required');
    }

    const results = [];
    for (const update of updates) {
      const { controlId, status, evidenceStatus, notes } = update;
      
      if (!controlId || !status) continue;

      const existingList = await db
        .select()
        .from(frameworkControlStatuses)
        .where(
          and(
            eq(frameworkControlStatuses.organizationId, organizationId),
            sql`${frameworkControlStatuses.framework} = ${framework.toLowerCase()}`,
            eq(frameworkControlStatuses.controlId, controlId)
          )
        )
        .limit(1);

      const existing = existingList[0];
      if (existing) {
        const [result] = await db
          .update(frameworkControlStatuses)
          .set({
            status,
            evidenceStatus: evidenceStatus || existing.evidenceStatus,
            notes: notes !== undefined ? notes : existing.notes,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(frameworkControlStatuses.id, existing.id))
          .returning();
        results.push(result);
      } else {
        const [result] = await db
          .insert(frameworkControlStatuses)
          .values({
            organizationId,
            framework: framework.toLowerCase() as any,
            controlId,
            status,
            evidenceStatus: evidenceStatus || 'none',
            notes: notes || null,
            updatedBy: userId
          })
          .returning();
        results.push(result);
      }
    }

    res.json({
      success: true,
      data: {
        updated: results.length,
        message: `${results.length} control statuses updated`
      }
    });
  }, { audit: { action: 'update', entityType: 'controlStatuses' } }));

  /**
   * Get summary statistics for all frameworks
   */
  router.get('/summary', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const allStatuses = await db
      .select()
      .from(frameworkControlStatuses)
      .where(eq(frameworkControlStatuses.organizationId, organizationId));

    // Group by framework
    const summary: Record<string, {
      total: number;
      implemented: number;
      inProgress: number;
      notStarted: number;
      notApplicable: number;
      progress: number;
    }> = {};

    const frameworks = ['iso27001', 'soc2', 'fedramp', 'nist'];
    
    for (const fw of frameworks) {
      const fwStatuses = allStatuses.filter(s => s.framework === fw);
      const implemented = fwStatuses.filter(s => s.status === 'implemented').length;
      const inProgress = fwStatuses.filter(s => s.status === 'in_progress').length;
      const notStarted = fwStatuses.filter(s => s.status === 'not_started').length;
      const notApplicable = fwStatuses.filter(s => s.status === 'not_applicable').length;
      const applicable = fwStatuses.length - notApplicable;
      
      summary[fw] = {
        total: fwStatuses.length,
        implemented,
        inProgress,
        notStarted,
        notApplicable,
        progress: applicable > 0 ? Math.round((implemented / applicable) * 100) : 0
      };
    }

    res.json({
      success: true,
      data: { summary }
    });
  }));

  app.use('/api/framework-control-statuses', router);

  // Compatibility routes for frontend - matches /api/frameworks/:framework/control-statuses pattern
  const frameworksRouter = Router();

  /**
   * Get all control statuses for a framework (compatibility endpoint)
   */
  frameworksRouter.get('/:framework/control-statuses', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const framework = req.params.framework;

    const statuses = await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          sql`${frameworkControlStatuses.framework} = ${framework.toLowerCase()}`
        )
      )
      .orderBy(frameworkControlStatuses.controlId);

    // Return as array for frontend compatibility
    res.json({ success: true, data: statuses });
  }));

  /**
   * Update a control status (compatibility endpoint)
   */
  frameworksRouter.put('/:framework/control-statuses/:controlId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { framework, controlId } = req.params;
    const { status, evidenceStatus, notes } = req.body;

    // Check if status exists
    const existingList = await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          sql`${frameworkControlStatuses.framework} = ${framework.toLowerCase()}`,
          eq(frameworkControlStatuses.controlId, controlId)
        )
      )
      .limit(1);

    const existing = existingList[0];
    let result;
    if (existing) {
      [result] = await db
        .update(frameworkControlStatuses)
        .set({
          status: status || existing.status,
          evidenceStatus: evidenceStatus || existing.evidenceStatus,
          notes: notes !== undefined ? notes : existing.notes,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(frameworkControlStatuses.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(frameworkControlStatuses)
        .values({
          organizationId,
          framework: framework.toLowerCase() as any,
          controlId,
          status: status || 'not_started',
          evidenceStatus: evidenceStatus || 'none',
          notes: notes || null,
          updatedBy: userId
        })
        .returning();
    }

    res.json({
      success: true,
      data: { controlStatus: result }
    });
  }, { audit: { action: 'update', entityType: 'controlStatus', getEntityId: (req) => req.params.controlId } }));

  app.use('/api/frameworks', frameworksRouter);
}
