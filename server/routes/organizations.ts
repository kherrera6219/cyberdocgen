import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { validateBody } from '../middleware/routeValidation';
import { createOrganizationSchema } from '../validation/requestSchemas';
import { 
  secureHandler,
  requireAuth
} from '../utils/errorHandling';

export function registerOrganizationsRoutes(router: Router) {
  /**
   * Get all organizations for current user
   */
  router.get("/", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const userOrganizations = await storage.getUserOrganizations(userId);
    const organizations = [];
    
    for (const userOrg of userOrganizations) {
      const org = await storage.getOrganization(userOrg.organizationId);
      if (org) {
        organizations.push({ ...org, role: userOrg.role });
      }
    }
    
    res.json({ success: true, data: organizations });
  }));

  /**
   * Create new organization
   */
  router.post("/", isAuthenticated, validateBody(createOrganizationSchema), secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const organizationData = req.body;
    
    const organization = await storage.createOrganization(organizationData);
    
    // Add creator as owner
    await storage.addUserToOrganization({
      userId,
      organizationId: organization.id,
      role: "owner",
    });
    
    logger.info('Organization created', { organizationId: organization.id, createdBy: userId });
    res.status(201).json({ success: true, data: organization });
  }, { audit: { action: 'create', entityType: 'organization' } }));
}
