import { Router } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { asyncHandler, NotFoundError, ValidationError } from '../utils/routeHelpers';
import { auditService } from '../services/auditService';
import { requireOrganization, type MultiTenantRequest } from '../middleware/multiTenant';

export function registerAuditTrailRoutes(router: Router) {
  router.get('/', isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
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
  }));

  router.get('/stats', isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
    const organizationId = req.organizationId!;
    
    const stats = await auditService.getAuditStats(organizationId);
    res.json(stats);
  }));

  router.get('/:id', isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
    const { id } = req.params;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    if (!id) {
      throw new ValidationError('Audit entry ID is required');
    }

    const auditEntry = await auditService.getAuditById(id, organizationId);

    if (!auditEntry) {
      throw new NotFoundError('Audit entry not found');
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
  }));
}
