import { Router } from 'express';
import { registerModelRoutes } from './models';
import { registerAnalysisRoutes } from './analysis';
import { registerGenerationRoutes } from './generation';
import { registerChatRoutes } from './chat';
import { registerRiskRoutes } from './risk';
import { registerQualityRoutes } from './quality';
import { registerVisionRoutes } from './vision';
import { registerIndustryRoutes } from './industry';
import { registerFineTuningRoutes } from './fineTuning';
import { registerStatsRoutes } from './stats';

/**
 * AI Routes Module
 * 
 * Aggregates all AI-related endpoints from sub-modules.
 */
export function registerAIRoutes(router: Router) {
  // Register all sub-modules
  // Note: Order matters if there are overlapping routes, but here they should be distinct
  
  registerModelRoutes(router);
  registerAnalysisRoutes(router);
  registerGenerationRoutes(router);
  registerChatRoutes(router);
  registerRiskRoutes(router);
  registerQualityRoutes(router);
  registerVisionRoutes(router);
  registerIndustryRoutes(router);
  registerFineTuningRoutes(router);
  registerStatsRoutes(router);
}
