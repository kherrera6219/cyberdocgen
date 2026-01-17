import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('API Integration Tests', () => {
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

  describe('Health Endpoints', () => {
    it('should return system health status (may be degraded in test)', async () => {
      const response = await request(app).get('/health');

      // In test environment without DB, health may return 503
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return AI health status', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Authentication Required Endpoints', () => {
    it('should require authentication for user profile', async () => {
      await request(app)
        .get('/api/auth/user')
        .expect(401);
    });

    it('should require authentication for company profiles', async () => {
      await request(app)
        .get('/api/company-profiles')
        .expect(401);
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent-route')
        .expect(404);
    });
  });
});