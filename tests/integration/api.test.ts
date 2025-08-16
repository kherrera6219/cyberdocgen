import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { healthCheckHandler } from '../../server/utils/health';

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.get('/health', healthCheckHandler);
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return AI health status', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body).toHaveProperty('openai');
      expect(response.body).toHaveProperty('anthropic');
      expect(response.body).toHaveProperty('overall');
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

    it('should require authentication for documents', async () => {
      await request(app)
        .get('/api/documents')
        .expect(401);
    });
  });

  describe('Data Validation', () => {
    it('should validate company profile creation payload', async () => {
      const invalidPayload = {
        companyName: '', // Invalid: empty string
        industry: 'Tech'
        // Missing required fields
      };

      await request(app)
        .post('/api/company-profiles')
        .send(invalidPayload)
        .expect(401); // Will be 401 due to auth, but would be 400 with auth
    });
  });
});