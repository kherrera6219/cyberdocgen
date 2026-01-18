import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }
}));

vi.mock('../../server/services/threatDetectionService', () => ({
  threatDetectionService: {
    analyzeRequest: vi.fn().mockReturnValue(null),
    shouldBlockRequest: vi.fn().mockReturnValue(false),
  }
}));

vi.mock('../../server/services/performanceService', () => ({
  performanceService: {
    recordRequest: vi.fn(),
  }
}));

import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { 
  securityHeaders, 
  csrfProtection, 
  threatDetection, 
  errorHandler,
  requestLogger,
  generateCsrfToken
} from '../../server/middleware/security';
import { ForbiddenError } from '../../server/utils/errorHandling';

import { threatDetectionService } from '../../server/services/threatDetectionService';
import { logger } from '../../server/utils/logger';


describe('Security Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
    }));
    vi.clearAllMocks();
  });

  describe('securityHeaders', () => {
    it('sets standard security headers', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.sendStatus(200));

      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('sets HSTS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.sendStatus(200));

      const response = await request(app).get('/test');
      expect(response.headers['strict-transport-security']).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('csrfProtection', () => {
    it('skips CSRF check in test environment (default)', async () => {
      app.use(csrfProtection);
      app.post('/test', (req, res) => res.sendStatus(200));

      const response = await request(app).post('/test');
      expect(response.status).toBe(200);
    });

    it('enforces CSRF when NODE_ENV is not test', async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-ignore - manually override to force logic
      process.env.NODE_ENV = 'development';

      const mockReq: any = {
        method: 'POST',
        path: '/api/action',
        cookies: {},
        get: vi.fn().mockReturnValue(undefined),
        session: { csrfToken: 'token' }
      };
      const mockRes: any = {};
      const mockNext = vi.fn();

      csrfProtection(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('CSRF_TOKEN_MISSING');
      
      process.env.NODE_ENV = originalEnv;
    });






    it('sets CSRF cookie on GET requests', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      app.use(csrfProtection);
      app.get('/test', (req, res) => res.sendStatus(200));
      app.use(errorHandler);

      const response = await request(app).get('/test');
      expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('csrf-token=')]));

      vi.unstubAllEnvs();
    });
  });

  describe('threatDetection', () => {
    it('blocks requests identified as threats', async () => {
      vi.mocked(threatDetectionService.analyzeRequest).mockReturnValue({
        type: 'sql_injection',
        severity: 'high'
      } as any);
      vi.mocked(threatDetectionService.shouldBlockRequest).mockReturnValue(true);

      app.use(threatDetection);
      app.get('/api/resource', (req, res) => res.sendStatus(200));
      app.use(errorHandler);

      const response = await request(app).get('/api/resource');
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('SECURITY_THREAT_DETECTED');
    });








    it('allows clean requests', async () => {
      vi.mocked(threatDetectionService.analyzeRequest).mockReturnValue(null);
      vi.mocked(threatDetectionService.shouldBlockRequest).mockReturnValue(false);

      app.use(threatDetection);
      app.get('/test', (req, res) => res.sendStatus(200));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });

  describe('errorHandler', () => {
    it('handles generic errors with 500 status', async () => {
      app.get('/error', (req, res) => { throw new Error('Boom'); });
      app.use(errorHandler);

      const response = await request(app).get('/error');
      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });

    it('handles validation errors', async () => {
      app.get('/error', (req, res, next) => { 
        const err: any = new Error('Validation failed');
        err.name = 'ValidationError';
        err.status = 400;
        next(err);
      });
      app.use(errorHandler);

      const response = await request(app).get('/error');
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('requestLogger', () => {
    it('logs requests', async () => {
      app.use(requestLogger);
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app).get('/test');
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
