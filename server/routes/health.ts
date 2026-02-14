/**
 * Database Health API Routes
 * Endpoints for monitoring database health and diagnostics
 */

import { Router } from 'express';
import { databaseHealthService } from '../services/databaseHealthService';
import { secureHandler } from '../utils/errorHandling';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * GET /api/health/database
 * Get comprehensive database health status
 */
router.get(
  '/database',
  isAuthenticated,
  secureHandler(async (req, res) => {
    const health = await databaseHealthService.checkHealth();
    
    res.json({
      success: true,
      data: health,
    });
  })
);

/**
 * GET /api/health/database/stats
 * Get database statistics
 */
router.get(
  '/database/stats',
  isAuthenticated,
  secureHandler(async (req, res) => {
    const stats = await databaseHealthService.getDatabaseStats();
    
    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * POST /api/health/database/verify
 * Verify database integrity
 */
router.post(
  '/database/verify',
  isAuthenticated,
  secureHandler(async (req, res) => {
    const result = await databaseHealthService.verifyIntegrity();
    
    res.json({
      success: result.ok,
      data: result,
    });
  })
);

/**
 * POST /api/health/metrics
 * Log usage metric (opt-in only)
 */
router.post(
  '/metrics',
  isAuthenticated,
  secureHandler(async (req, res) => {
    const { eventType, eventData } = req.body;

    if (!eventType) {
      res.status(400).json({
        success: false,
        error: 'Event type is required',
      });
      return;
    }

    await databaseHealthService.logUsageMetric(eventType, eventData || {});

    res.json({
      success: true,
      message: 'Metric logged',
    });
  })
);

export default router;
