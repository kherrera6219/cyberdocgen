// AI Model Management Routes
import { Router, Response, NextFunction } from 'express';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { isAuthenticated, secureHandler, requireOrganization, type MultiTenantRequest } from './shared';
import { modelVersionCatalog } from '../../services/modelVersionCatalog';
import { promptTemplateRegistry } from '../../services/promptTemplateRegistry';

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

  /**
   * GET /api/ai/models/catalog
   * Get governed model catalog with provider/version metadata
   */
  router.get("/models/catalog", isAuthenticated, requireOrganization, secureHandler(async (_req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    res.json({
      success: true,
      data: {
        models: modelVersionCatalog.list(),
      },
    });
  }));

  /**
   * GET /api/ai/prompts/registry
   * Get versioned prompt template registry
   */
  router.get("/prompts/registry", isAuthenticated, requireOrganization, secureHandler(async (_req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    res.json({
      success: true,
      data: {
        templates: promptTemplateRegistry.listTemplates(),
      },
    });
  }));
}
