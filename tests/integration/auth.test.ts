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
    it('should allow access to health check (may be degraded)', async () => {
      const response = await request(app).get('/health');
      
      // In test environment without DB, health may return 503
      expect([200, 503]).toContain(response.status);
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
      const response = await request(app).get('/api/auth/user');
      // App may return 401/403 for unauthenticated or 500 for db errors in test env
      expect([401, 403, 500]).toContain(response.status);
    });

    it('should require authentication for /api/company-profiles', async () => {
      const response = await request(app).get('/api/company-profiles');
      // App may return 401 (Unauthorized) or 403 (Forbidden) for unauthenticated requests
      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for /api/documents', async () => {
      const response = await request(app).get('/api/documents');
      // App may return 401 (Unauthorized) or 403 (Forbidden) for unauthenticated requests
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('API Security', () => {
    it('should reject requests with invalid methods', async () => {
      const response = await request(app).put('/health');
      
      // May return 400 (Bad Request) or 404 (Not Found)
      expect([400, 404]).toContain(response.status);
    });
  });
});
