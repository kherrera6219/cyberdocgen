// AI Model Management Routes
import { Router, Response, NextFunction } from 'express';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { isAuthenticated, secureHandler, requireOrganization, type MultiTenantRequest } from './shared';

export function registerModelRoutes(router: Router) {
  /**
   * GET /api/ai/models
   * Get list of available AI models
   */
  router.get("/models", isAuthenticated, requireOrganization, secureHandler(async (_req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const models = aiOrchestrator.getAvailableModels();
    res.json({
      success: true,
      data: { models }
    });
  }));
}
