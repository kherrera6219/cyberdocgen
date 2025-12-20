import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { frameworkControlStatuses } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export function registerFrameworkControlStatusesRoutes(app: Router) {
  const router = Router();

  /**
   * @openapi
   * /api/framework-control-statuses:
   *   get:
   *     tags: [Framework Controls]
   *     summary: Get all control statuses for a framework
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: framework
   *         required: true
   *         schema:
   *           type: string
   *           enum: [iso27001, soc2, fedramp, nist]
   *     responses:
   *       200:
   *         description: List of control statuses
   *       401:
   *         description: Unauthorized
   */
  router.get('/', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';
      const framework = req.query.framework as string;

      if (!framework) {
        return res.status(400).json({ message: 'Framework parameter is required' });
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
        framework,
        statuses: statusMap,
        count: statuses.length
      });
    } catch (error) {
      logger.error('Failed to get framework control statuses', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve control statuses' });
    }
  });

  /**
   * @openapi
   * /api/framework-control-statuses/{controlId}:
   *   put:
   *     tags: [Framework Controls]
   *     summary: Update or create a control status
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: controlId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - framework
   *               - status
   *             properties:
   *               framework:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [not_started, in_progress, implemented, not_applicable]
   *               evidenceStatus:
   *                 type: string
   *                 enum: [none, partial, complete]
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Control status updated
   *       401:
   *         description: Unauthorized
   */
  router.put('/:controlId', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';
      const { controlId } = req.params;
      const { framework, status, evidenceStatus, notes } = req.body;

      if (!framework || !status) {
        return res.status(400).json({ message: 'Framework and status are required' });
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
        // Update existing
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
        // Create new
        [result] = await db
          .insert(frameworkControlStatuses)
          .values({
            organizationId,
            framework: framework.toLowerCase() as any,
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
        controlStatus: result,
        message: 'Control status updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update control status', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to update control status' });
    }
  });

  /**
   * @openapi
   * /api/framework-control-statuses/bulk:
   *   post:
   *     tags: [Framework Controls]
   *     summary: Bulk update control statuses
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
   *               - updates
   *             properties:
   *               framework:
   *                 type: string
   *               updates:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     controlId:
   *                       type: string
   *                     status:
   *                       type: string
   *     responses:
   *       200:
   *         description: Bulk update successful
   *       401:
   *         description: Unauthorized
   */
  router.post('/bulk', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const organizationId = user.organizationId || 'default';
      const { framework, updates } = req.body;

      if (!framework || !Array.isArray(updates)) {
        return res.status(400).json({ message: 'Framework and updates array are required' });
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
              framework: framework.toLowerCase() as any,
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
        updated: results.length,
        message: `${results.length} control statuses updated`
      });
    } catch (error) {
      logger.error('Failed to bulk update control statuses', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to bulk update control statuses' });
    }
  });

  /**
   * @openapi
   * /api/framework-control-statuses/summary:
   *   get:
   *     tags: [Framework Controls]
   *     summary: Get summary statistics for all frameworks
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Summary statistics
   *       401:
   *         description: Unauthorized
   */
  router.get('/summary', isAuthenticated, async (req, res) => {
    try {
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
        summary
      });
    } catch (error) {
      logger.error('Failed to get control status summary', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve summary' });
    }
  });

  app.use('/api/framework-control-statuses', router);

  // Compatibility routes for frontend - matches /api/frameworks/:framework/control-statuses pattern
  const frameworksRouter = Router();

  // GET /api/frameworks/:framework/control-statuses - get all control statuses for a framework
  frameworksRouter.get('/:framework/control-statuses', isAuthenticated, async (req, res) => {
    try {
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
      res.json(statuses);
    } catch (error) {
      logger.error('Failed to get framework control statuses', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve control statuses' });
    }
  });

  // PUT /api/frameworks/:framework/control-statuses/:controlId - update a control status
  frameworksRouter.put('/:framework/control-statuses/:controlId', isAuthenticated, async (req, res) => {
    try {
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
        controlStatus: result
      });
    } catch (error) {
      logger.error('Failed to update control status', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to update control status' });
    }
  });

  app.use('/api/frameworks', frameworksRouter);
}
