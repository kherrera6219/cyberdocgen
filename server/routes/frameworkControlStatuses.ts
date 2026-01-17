import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { frameworkControlStatuses } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { 
  secureHandler,
  ValidationError
} from '../utils/errorHandling';

export function registerFrameworkControlStatusesRoutes(app: Router) {
  const router = Router();

  /**
   * Get all control statuses for a framework
   */
  router.get('/', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';
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
  router.put('/:controlId', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';
    const { controlId } = req.params;
    const { framework, status, evidenceStatus, notes } = req.body;

    if (!framework || !status) {
      throw new ValidationError('Framework and status are required');
    }

    // Check if status exists
    const existing = await db
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

    let result;
    if (existing.length > 0) {
      [result] = await db
        .update(frameworkControlStatuses)
        .set({
          status,
          evidenceStatus: evidenceStatus || existing[0].evidenceStatus,
          notes: notes !== undefined ? notes : existing[0].notes,
          updatedBy: user.id,
          updatedAt: new Date()
        })
        .where(eq(frameworkControlStatuses.id, existing[0].id))
        .returning();
    } else {
      [result] = await db
        .insert(frameworkControlStatuses)
        .values({
          organizationId,
          framework: framework.toLowerCase(),
          controlId,
          status,
          evidenceStatus: evidenceStatus || 'none',
          notes: notes || null,
          updatedBy: user.id
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
  router.post('/bulk', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';
    const { framework, updates } = req.body;

    if (!framework || !Array.isArray(updates)) {
      throw new ValidationError('Framework and updates array are required');
    }

    const results = [];
    for (const update of updates) {
      const { controlId, status, evidenceStatus, notes } = update;
      
      if (!controlId || !status) continue;

      const existing = await db
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

      if (existing.length > 0) {
        const [result] = await db
          .update(frameworkControlStatuses)
          .set({
            status,
            evidenceStatus: evidenceStatus || existing[0].evidenceStatus,
            notes: notes !== undefined ? notes : existing[0].notes,
            updatedBy: user.id,
            updatedAt: new Date()
          })
          .where(eq(frameworkControlStatuses.id, existing[0].id))
          .returning();
        results.push(result);
      } else {
        const [result] = await db
          .insert(frameworkControlStatuses)
          .values({
            organizationId,
            framework: framework.toLowerCase(),
            controlId,
            status,
            evidenceStatus: evidenceStatus || 'none',
            notes: notes || null,
            updatedBy: user.id
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
  router.get('/summary', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';

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
  frameworksRouter.get('/:framework/control-statuses', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';
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
  frameworksRouter.put('/:framework/control-statuses/:controlId', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user.organizationId || 'default';
    const { framework, controlId } = req.params;
    const { status, evidenceStatus, notes } = req.body;

    // Check if status exists
    const existing = await db
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

    let result;
    if (existing.length > 0) {
      [result] = await db
        .update(frameworkControlStatuses)
        .set({
          status: status || existing[0].status,
          evidenceStatus: evidenceStatus || existing[0].evidenceStatus,
          notes: notes !== undefined ? notes : existing[0].notes,
          updatedBy: user.id,
          updatedAt: new Date()
        })
        .where(eq(frameworkControlStatuses.id, existing[0].id))
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
          updatedBy: user.id
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
