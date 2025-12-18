import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { documentApprovals } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export function registerControlsRoutes(app: Router) {
  const router = Router();

  /**
   * @openapi
   * /api/controls/approvals:
   *   get:
   *     tags: [Controls]
   *     summary: List pending control approvals
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of pending approvals
   *       401:
   *         description: Unauthorized
   */
  router.get('/approvals', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;

      // Get all document approvals (controls are treated as documents)
      // Filter for pending approvals or get all based on user role
      const approvalsList = await db
        .select()
        .from(documentApprovals)
        .where(eq(documentApprovals.status, 'pending'))
        .orderBy(desc(documentApprovals.createdAt))
        .limit(100);

      res.json({
        success: true,
        approvals: approvalsList,
        count: approvalsList.length
      });
    } catch (error) {
      logger.error('Failed to list control approvals', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to retrieve control approvals' });
    }
  });

  /**
   * @openapi
   * /api/controls/{id}/approve:
   *   post:
   *     tags: [Controls]
   *     summary: Approve a control
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Control approved
   *       401:
   *         description: Unauthorized
   */
  router.post('/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { comments, approved } = req.body;

      const approvalId = parseInt(id, 10);
      if (isNaN(approvalId)) {
        return res.status(400).json({ message: 'Invalid approval ID' });
      }

      // Update the approval status
      const [updatedApproval] = await db
        .update(documentApprovals)
        .set({
          status: approved ? 'approved' : 'rejected',
          approvedAt: new Date(),
          comments: comments || null
        })
        .where(eq(documentApprovals.id, approvalId.toString()))
        .returning();

      if (!updatedApproval) {
        return res.status(404).json({ message: 'Approval not found' });
      }

      res.json({
        success: true,
        approval: updatedApproval,
        message: `Control ${approved ? 'approved' : 'rejected'} successfully`
      });
    } catch (error) {
      logger.error('Failed to approve control', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to process control approval' });
    }
  });

  app.use('/api/controls', router);
}
