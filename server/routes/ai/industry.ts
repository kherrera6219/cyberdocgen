// AI Industry Routes
// Industry-specific configuration and data
import { Router } from 'express';
import {
  isAuthenticated,
  asyncHandler,
  NotFoundError
} from './shared';

export function registerIndustryRoutes(router: Router) {
  /**
   * GET /api/ai/industries
   * Get available industry configurations
   */
  router.get("/industries", isAuthenticated, asyncHandler(async (req, res) => {
    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configurations = service.getIndustryConfigurations();
    res.json({ success: true, configurations });
  }));

  /**
   * GET /api/ai/industries/:industryId
   * Get specific industry configuration
   */
  router.get("/industries/:industryId", isAuthenticated, asyncHandler(async (req, res) => {
    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configuration = service.getIndustryConfiguration(req.params.industryId);
    
    if (!configuration) {
      throw new NotFoundError("Industry not found");
    }
    
    res.json({ success: true, configuration });
  }));
}
