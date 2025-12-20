import { Router } from 'express';
import { isAuthenticated, getUserId, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { auditService } from '../services/auditService';
import { storage } from '../storage';
import { requireOrganization, type MultiTenantRequest } from '../middleware/multiTenant';

export function registerAuditTrailRoutes(router: Router) {
  router.get('/', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { page = 1, limit = 50, entityType, action, search, dateFrom, dateTo } = req.query;
      const userId = getRequiredUserId(req);
      const organizationId = req.organizationId!;
      
      const auditQuery = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        ...(entityType && { entityType: entityType as string }),
        ...(action && { action: action as string }),
        ...(search && { search: search as string }),
        ...(dateFrom && { dateFrom: new Date(dateFrom as string) }),
        ...(dateTo && { dateTo: new Date(dateTo as string) })
      };

      const result = await auditService.getAuditLogs(organizationId, auditQuery);
      
      await auditService.logAction({
        action: "view",
        entityType: "audit_trail",
        entityId: "system",
        userId: userId,
        organizationId,
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: { filters: auditQuery }
      });

      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit trail:', { error: errorMessage, userId: getUserId(req) }, req);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });

  router.get('/stats', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      
      const stats = await auditService.getAuditStats(organizationId);
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching audit stats:', { error: errorMessage, userId: getUserId(req) }, req);
      res.status(500).json({ message: 'Failed to fetch audit statistics' });
    }
  });

  router.get('/:id', isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const { id } = req.params;
      const userId = getRequiredUserId(req);
      const organizationId = req.organizationId!;

      if (!id) {
        return res.status(400).json({ message: 'Audit entry ID is required' });
      }

      const auditEntry = await auditService.getAuditById(id, organizationId);

      if (!auditEntry) {
        return res.status(404).json({ message: 'Audit entry not found' });
      }

      await auditService.logAction({
        action: "view",
        entityType: "audit_log",
        entityId: id,
        userId,
        organizationId,
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
