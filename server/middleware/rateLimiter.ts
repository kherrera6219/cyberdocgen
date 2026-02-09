import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  general: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests, please try again later.',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: false,
  },
  authStrict: {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many failed authentication attempts. Account temporarily locked.',
    skipSuccessfulRequests: true,
  },
  ai: {
    windowMs: 60 * 1000,
    max: 20,
    message: 'AI generation rate limit exceeded. Please wait before making more requests.',
  },
  aiGeneration: {
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: 'AI document generation limit exceeded. Please try again later.',
  },
  api: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'API rate limit exceeded. Please slow down your requests.',
  },
  upload: {
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Upload rate limit exceeded. Please try again later.',
  },
};

const onLimitReached = (tier: string, req: Request) => {
  const userId = (req as any).session?.userId || (req as any).user?.claims?.sub;
  const key = userId ? `user:${userId}` : `ip:${req.ip}`;
  
  logger.warn('Rate limit exceeded', {
    tier,
    key,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
  });
};

function createRateLimiter(tier: keyof typeof rateLimitConfigs) {
  const configMap = new Map(Object.entries(rateLimitConfigs));
  const config = configMap.get(tier);
  if (!config) {
    throw new Error(`Unknown rate limiter tier: ${tier}`);
  }
  
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.max,
    message: { 
      error: config.message,
      retryAfter: Math.ceil(config.windowMs / 1000),
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ipv6Subnet: 64,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    skipFailedRequests: config.skipFailedRequests || false,
    handler: (req, res, next, options) => {
      onLimitReached(tier, req);
      res.status(429).json({
        error: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    },
  });
}

export const generalLimiter = createRateLimiter('general');
export const authLimiter = createRateLimiter('auth');
export const authStrictLimiter = createRateLimiter('authStrict');
export const aiLimiter = createRateLimiter('ai');
export const aiGenerationLimiter = createRateLimiter('aiGeneration');
export const apiLimiter = createRateLimiter('api');
export const uploadLimiter = createRateLimiter('upload');

export function getRateLimitMiddleware(tier: keyof typeof rateLimitConfigs = 'general') {
  return createRateLimiter(tier);
}

/**
 * AI Request Size Limiter Middleware
 * Validates that AI request payloads don't exceed configured limits
 * Prevents memory exhaustion and abuse of AI endpoints
 */
const AI_REQUEST_LIMITS = {
  maxPromptLength: 100000, // 100KB max for prompts
  maxContentLength: 500000, // 500KB max for document content
  maxContextItems: 50, // Max number of context items
  maxMetadataSize: 10000, // 10KB max for metadata
};

export function validateAIRequestSize(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    
    // Skip if no body
    if (!body || typeof body !== 'object') {
      return next();
    }
    
    // Validate prompt length
    if (body.prompt && typeof body.prompt === 'string') {
      if (body.prompt.length > AI_REQUEST_LIMITS.maxPromptLength) {
        logger.warn('AI request rejected: prompt too large', {
          promptLength: body.prompt.length,
          maxAllowed: AI_REQUEST_LIMITS.maxPromptLength,
          ip: req.ip,
        });
        return res.status(413).json({ 
          error: 'Request payload too large',
          detail: `Prompt exceeds maximum length of ${AI_REQUEST_LIMITS.maxPromptLength} characters`,
        });
      }
    }
    
    // Validate content length (for document processing)
    if (body.content && typeof body.content === 'string') {
      if (body.content.length > AI_REQUEST_LIMITS.maxContentLength) {
        logger.warn('AI request rejected: content too large', {
          contentLength: body.content.length,
          maxAllowed: AI_REQUEST_LIMITS.maxContentLength,
          ip: req.ip,
        });
        return res.status(413).json({ 
          error: 'Request payload too large',
          detail: `Content exceeds maximum length of ${AI_REQUEST_LIMITS.maxContentLength} characters`,
        });
      }
    }
    
    // Validate documentContent (for extraction services)
    if (body.documentContent && typeof body.documentContent === 'string') {
      if (body.documentContent.length > AI_REQUEST_LIMITS.maxContentLength) {
        logger.warn('AI request rejected: documentContent too large', {
          contentLength: body.documentContent.length,
          maxAllowed: AI_REQUEST_LIMITS.maxContentLength,
          ip: req.ip,
        });
        return res.status(413).json({ 
          error: 'Request payload too large',
          detail: `Document content exceeds maximum length of ${AI_REQUEST_LIMITS.maxContentLength} characters`,
        });
      }
    }
    
    // Validate context array size
    if (body.context && Array.isArray(body.context)) {
      if (body.context.length > AI_REQUEST_LIMITS.maxContextItems) {
        logger.warn('AI request rejected: too many context items', {
          contextItems: body.context.length,
          maxAllowed: AI_REQUEST_LIMITS.maxContextItems,
          ip: req.ip,
        });
        return res.status(413).json({ 
          error: 'Request payload too large',
          detail: `Context array exceeds maximum of ${AI_REQUEST_LIMITS.maxContextItems} items`,
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error validating AI request size', { error });
    next(); // Allow request to proceed on validation error
  }
}

export { rateLimitConfigs, AI_REQUEST_LIMITS };
