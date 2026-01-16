import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { validateBody } from '../middleware/routeValidation';
import { createOrganizationSchema } from '../validation/requestSchemas';

export function registerOrganizationsRoutes(router: Router) {
  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const userOrganizations = await storage.getUserOrganizations(userId);
      const organizations = [];
      
      for (const userOrg of userOrganizations) {
        const org = await storage.getOrganization(userOrg.organizationId);
        if (org) {
          organizations.push({ ...org, role: userOrg.role });
        }
      }
      
      res.json(organizations);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Error fetching organizations", { error: errorMessage });
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  router.post("/", isAuthenticated, validateBody(createOrganizationSchema), async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const organizationData = req.body;
      
      const organization = await storage.createOrganization(organizationData);
      
      await storage.addUserToOrganization({
        userId,
        organizationId: organization.id,
        role: "owner",
      });
      
      res.status(201).json(organization);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Error creating organization", { error: errorMessage });
      res.status(500).json({ message: "Failed to create organization" });
    }
  });
}
