import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
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
  const config = rateLimitConfigs[tier];
  
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

export { rateLimitConfigs };
