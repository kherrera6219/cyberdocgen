// AI Industry Routes
// Industry-specific configuration and data
import { Router, Response, NextFunction } from 'express';
import {
  isAuthenticated,
  secureHandler,
  requireOrganization,
  type MultiTenantRequest,
  NotFoundError
} from './shared';

export function registerIndustryRoutes(router: Router) {
  /**
   * GET /api/ai/industries
   * Get available industry configurations
   */
  router.get("/industries", isAuthenticated, requireOrganization, secureHandler(async (_req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configurations = service.getIndustryConfigurations();
    
    res.json({ 
      success: true, 
      data: { configurations } 
    });
  }));

  /**
   * GET /api/ai/industries/:industryId
   * Get specific industry configuration
   */
  router.get("/industries/:industryId", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configuration = service.getIndustryConfiguration(req.params.industryId);
    
    if (!configuration) {
      throw new NotFoundError("Industry not found");
    }
    
    res.json({ 
      success: true, 
      data: { configuration } 
    });
  }));
}
