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
      await request(app)
        .get('/api/auth/user')
        .expect(401);
    });

    it('should require authentication for /api/company-profiles', async () => {
      await request(app)
        .get('/api/company-profiles')
        .expect(401);
    });

    it('should require authentication for /api/documents', async () => {
      await request(app)
        .get('/api/documents')
        .expect(401);
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
