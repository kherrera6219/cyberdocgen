// AI Model Management Routes
import { Router } from 'express';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { isAuthenticated, asyncHandler } from './shared';

export function registerModelRoutes(router: Router) {
  /**
   * GET /api/ai/models
   * Get list of available AI models
   */
  router.get("/models", isAuthenticated, asyncHandler(async (req, res) => {
    const models = aiOrchestrator.getAvailableModels();
    res.json({ models });
  }));
}
