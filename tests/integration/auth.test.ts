import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Authentication Integration Tests', () => {
  let app: any;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app as express.Express);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Public Endpoints', () => {
    it('should allow access to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should allow access to AI health endpoint', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Protected Endpoints', () => {
    it('should require authentication for /api/auth/user', async () => {
      await request(app)
        .get('/api/auth/user')
        .expect(401);
    });

    it('should require authentication for /api/company-profiles', async () => {
      await request(app)
        .get('/api/company-profiles')
        .expect(401);
    });

    it('should require authentication for document generation', async () => {
      await request(app)
        .post('/api/documents/generate')
        .send({
          title: 'Test',
          framework: 'SOC2',
          category: 'policy'
        })
        .expect(401);
    });

    it('should require authentication for gap analysis', async () => {
      await request(app)
        .post('/api/gap-analysis')
        .send({
          framework: 'SOC2',
          companyProfileId: 'test-id'
        })
        .expect(401);
    });

    it('should require authentication for audit logs', async () => {
      await request(app)
        .get('/api/audit-logs')
        .expect(401);
    });

    it('should require authentication for MFA setup', async () => {
      await request(app)
        .post('/api/auth/mfa/setup')
        .expect(401);
    });
  });

  describe('Session Handling', () => {
    it('should return 401 for invalid session', async () => {
      await request(app)
        .get('/api/auth/user')
        .set('Cookie', 'session=invalid-session-token')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
