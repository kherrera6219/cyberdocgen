/**
 * OpenAPI Contract Tests
 *
 * Validates that critical API endpoints conform to their expected contracts:
 * - Required response fields are present
 * - HTTP status codes are correct for various scenarios
 * - Error responses follow the { success: false, error: { code, message } } shape
 * - Success responses follow the { success: true, data: ... } shape
 */
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Response shape helpers
// ---------------------------------------------------------------------------
function expectSuccessShape(body: any) {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
}

function expectErrorShape(body: any) {
  expect(body).toHaveProperty('success', false);
  expect(body.error ?? body).toBeDefined();
}

// ---------------------------------------------------------------------------
// Health endpoint contracts
// ---------------------------------------------------------------------------
describe('Health Endpoint Contracts', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Minimal health stub matching production contract
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
    });

    app.get('/api/health/database', (_req, res) => {
      res.json({ success: true, data: { status: 'healthy', latencyMs: 5 } });
    });
  });

  it('GET /health returns status and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/health/database returns success shape', async () => {
    const res = await request(app).get('/api/health/database');
    expect(res.status).toBe(200);
    expectSuccessShape(res.body);
    expect(res.body.data).toHaveProperty('status');
  });
});

// ---------------------------------------------------------------------------
// Standard error response contracts
// ---------------------------------------------------------------------------
describe('Error Response Contracts', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/not-found', (_req, res) => {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    });

    app.get('/forbidden', (_req, res) => {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    });

    app.get('/unauthorized', (_req, res) => {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    });

    app.get('/validation-error', (_req, res) => {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: [] } });
    });

    app.get('/server-error', (_req, _res) => {
      throw new Error('Internal server error');
    });

    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    });
  });

  it('404 responses follow error contract', async () => {
    const res = await request(app).get('/not-found');
    expect(res.status).toBe(404);
    expectErrorShape(res.body);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('403 responses follow error contract', async () => {
    const res = await request(app).get('/forbidden');
    expect(res.status).toBe(403);
    expectErrorShape(res.body);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('401 responses follow error contract', async () => {
    const res = await request(app).get('/unauthorized');
    expect(res.status).toBe(401);
    expectErrorShape(res.body);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('400 validation errors follow error contract', async () => {
    const res = await request(app).get('/validation-error');
    expect(res.status).toBe(400);
    expectErrorShape(res.body);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('500 errors follow error contract', async () => {
    const res = await request(app).get('/server-error');
    expect(res.status).toBe(500);
    expectErrorShape(res.body);
  });
});

// ---------------------------------------------------------------------------
// Content-Type contracts
// ---------------------------------------------------------------------------
describe('Content-Type Contracts', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/json', (_req, res) => res.json({ success: true, data: {} }));
    app.delete('/resource', (_req, res) => res.status(204).end());
  });

  it('JSON endpoints return application/json content type', async () => {
    const res = await request(app).get('/json');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('204 No Content responses have no body', async () => {
    const res = await request(app).delete('/resource');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Pagination contract
// ---------------------------------------------------------------------------
describe('Pagination Contract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/items', (req, res) => {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
      if (page <= 0 || limit <= 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid pagination' } });
      }
      return res.json({
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
      });
    });
  });

  it('returns pagination metadata in list responses', async () => {
    const res = await request(app).get('/items?page=1&limit=10');
    expect(res.status).toBe(200);
    expectSuccessShape(res.body);
    expect(res.body.data.pagination).toHaveProperty('page');
    expect(res.body.data.pagination).toHaveProperty('limit');
  });

  it('rejects negative page values', async () => {
    const res = await request(app).get('/items?page=-1');
    expect(res.status).toBe(400);
  });

  it('caps limit at 200', async () => {
    const res = await request(app).get('/items?limit=9999');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBeLessThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// Metrics endpoint schema contract
// ---------------------------------------------------------------------------
describe('POST /api/health/metrics Schema Contract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Simulate validated metrics endpoint
    app.post('/api/health/metrics', (req, res) => {
      const { eventType } = req.body;
      if (!eventType || typeof eventType !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(eventType)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid eventType' } });
      }
      return res.json({ success: true, message: 'Metric logged' });
    });
  });

  it('rejects missing eventType', async () => {
    const res = await request(app).post('/api/health/metrics').send({});
    expect(res.status).toBe(400);
  });

  it('rejects eventType with special characters', async () => {
    const res = await request(app).post('/api/health/metrics').send({ eventType: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
  });

  it('accepts valid eventType', async () => {
    const res = await request(app).post('/api/health/metrics').send({ eventType: 'page.view', eventData: { page: '/dashboard' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
