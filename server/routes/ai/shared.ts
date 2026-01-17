// Shared imports and utilities for AI routes
import { isAuthenticated, getRequiredUserId, getUserId } from '../../replitAuth';
import { logger } from '../../utils/logger';
import { 
  secureHandler, 
  validateInput,
  AppError, 
  ValidationError, 
  NotFoundError, 
  ForbiddenError 
} from '../../utils/errorHandling';
import { requireOrganization, type MultiTenantRequest } from '../../middleware/multiTenant';
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
  secureHandler,
  validateInput,
  requireOrganization,
  MultiTenantRequest,
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  validateAIRequestSize,
  aiLimiter,
  generationLimiter,
  auditService,
  metricsCollector,
  aiGuardrailsService,
  crypto
};
