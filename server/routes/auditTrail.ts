import { Router } from 'express';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { auditService } from '../services/auditService';

export function registerAuditTrailRoutes(router: Router) {
  router.get('/', isAuthenticated, async (req: any, res) => {
    try {
      const { page = 1, limit = 50, entityType, action, search, dateFrom, dateTo } = req.query;
      const userId = getUserId(req);
      
      const auditQuery = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        ...(entityType && { entityType: entityType as string }),
        ...(action && { action: action as string }),
        ...(search && { search: search as string }),
        ...(dateFrom && { dateFrom: new Date(dateFrom as string) }),
        ...(dateTo && { dateTo: new Date(dateTo as string) })
      };

      const result = await auditService.getAuditLogs(auditQuery);
      
      await auditService.logAction({
        action: "view",
        entityType: "audit_trail",
        entityId: "system",
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { filters: auditQuery }
      });

      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit trail:', { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });

  router.get('/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await auditService.getAuditStats();
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit stats:', { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: 'Failed to fetch audit statistics' });
    }
  });

  router.get('/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);

      if (!id) {
        return res.status(400).json({ message: 'Audit entry ID is required' });
      }

      // Get single audit entry by ID
      const auditEntry = await auditService.getAuditById(id);

      if (!auditEntry) {
        return res.status(404).json({ message: 'Audit entry not found' });
      }

      // Log access to audit entry
      await auditService.logAction({
        action: "view",
        entityType: "audit_log",
        entityId: id,
        userId,
        ipAddress: req.ip || '',
        details: { message: `Viewed audit entry ${id}`, auditId: id }
      });

      res.json({
        success: true,
        auditEntry
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit entry:', { error: errorMessage, auditId: req.params.id }, req);
      res.status(500).json({ message: 'Failed to fetch audit entry' });
    }
  });
}
