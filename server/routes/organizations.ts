import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { createOrganizationSchema } from '../validation/requestSchemas';
import { 
  secureHandler,
  validateInput
} from '../utils/errorHandling';
import { auditService, AuditAction } from '../services/auditService';
import { type MultiTenantRequest } from '../middleware/multiTenant';

export function registerOrganizationsRoutes(router: Router) {
  /**
   * Get all organizations for current user
   */
  router.get("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const userOrganizationsList = await storage.getUserOrganizations(userId);
    const orgResults = await Promise.all(
      userOrganizationsList.map(userOrg => storage.getOrganization(userOrg.organizationId))
    );
    const organizations = orgResults
      .map((org, i) => org ? { ...org, role: userOrganizationsList[i].role } : null)
      .filter((org): org is NonNullable<typeof org> => org !== null);

    res.json({ success: true, data: organizations });
  }));

  /**
   * Create new organization
   */
  router.post("/", isAuthenticated, validateInput(createOrganizationSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationData = req.body;
    
    const organization = await storage.createOrganization(organizationData);
    
    // Add creator as owner
    await storage.addUserToOrganization({
      userId,
      organizationId: organization.id,
      role: "owner",
    });
    
    // Log audit trail
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'organization',
      entityId: organization.id,
      userId,
      organizationId: organization.id,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'organization_creation',
        name: organization.name
      }
    });

    res.status(201).json({ success: true, data: organization });
  }));
}
