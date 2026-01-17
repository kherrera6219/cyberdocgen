// Shared imports and utilities for AI routes
import { isAuthenticated, getRequiredUserId, getUserId } from '../../replitAuth';
import { logger } from '../../utils/logger';
import { asyncHandler, AppError, ValidationError, NotFoundError, ForbiddenError } from '../../utils/routeHelpers';
import { validateBody } from '../../middleware/routeValidation';
import { validateAIRequestSize, aiLimiter } from '../../middleware/rateLimiter';
import { generationLimiter } from '../../middleware/security';
import { auditService } from '../../services/auditService';
import { metricsCollector } from '../../monitoring/metrics';
import { aiGuardrailsService } from '../../services/aiGuardrailsService';
import crypto from 'crypto';

// Re-export commonly used items
export {
  isAuthenticated,
  getRequiredUserId,
  getUserId,
  logger,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  validateBody,
  validateAIRequestSize,
  aiLimiter,
  generationLimiter,
  auditService,
  metricsCollector,
  aiGuardrailsService,
  crypto
};
