import { describe, it, expect, beforeEach, vi } from 'vitest';
import { metricsCollector } from '../../server/monitoring/metrics';
import { Request, Response } from 'express';

describe('MetricsCollector', () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  it('should initialize with empty metrics', () => {
    const metrics = metricsCollector.getMetrics();
    expect(metrics.requests.total).toBe(0);
    expect(metrics.ai.documentsGenerated).toBe(0);
    expect(metrics.database.queries).toBe(0);
    expect(metrics.security.authAttempts).toBe(0);
    expect(metrics.connectors.totalRequests).toBe(0);
  });

  it('should track AI operations', () => {
    metricsCollector.trackAIOperation('generation', true);
    metricsCollector.trackAIOperation('analysis', false);
    metricsCollector.trackAIOperation('chat', true);
    
    const metrics = metricsCollector.getMetrics();
    expect(metrics.ai.documentsGenerated).toBe(1);
    expect(metrics.ai.analysisRequests).toBe(1);
    expect(metrics.ai.chatbotInteractions).toBe(1);
    expect(metrics.ai.errorRate).toBeGreaterThan(0);
  });

  it('should track database operations', () => {
    metricsCollector.trackDatabaseOperation(100, true);
    metricsCollector.trackDatabaseOperation(200, false);
    
    const metrics = metricsCollector.getMetrics();
    expect(metrics.database.queries).toBe(2);
    expect(metrics.database.errors).toBe(1);
    expect(metrics.database.avgResponseTime).toBeCloseTo(110, -1); // (100*1 + 200*0.1)/1.1 approx or EMA
  });

  it('should track security events', () => {
    metricsCollector.trackSecurityEvent('auth_attempt');
    metricsCollector.trackSecurityEvent('auth_failure');
    metricsCollector.trackSecurityEvent('rate_limit');
    
    const metrics = metricsCollector.getMetrics();
    expect(metrics.security.authAttempts).toBe(1);
    expect(metrics.security.failedAuths).toBe(1);
    expect(metrics.security.rateLimitHits).toBe(1);
  });

  it('should track connector latency and errors', () => {
    metricsCollector.trackConnectorRequest('jira', 120, true);
    metricsCollector.trackConnectorRequest('jira', 240, false);
    metricsCollector.trackConnectorRequest('notion', 80, true);

    const metrics = metricsCollector.getMetrics();
    expect(metrics.connectors.totalRequests).toBe(3);
    expect(metrics.connectors.totalErrors).toBe(1);
    expect(metrics.connectors.byType.jira.requests).toBe(2);
    expect(metrics.connectors.byType.jira.errors).toBe(1);
    expect(metrics.computedMetrics.connectorErrorRate).toBeGreaterThan(0);
  });

  it('should collect request metrics via middleware', async () => {
    const middleware = metricsCollector.requestMetrics();
    const req = { path: '/test-api' } as Request;
    const res = { 
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate the finish event
          callback();
        }
      })
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    
    // The 'finish' event is triggered in the middleware
    const metrics = metricsCollector.getMetrics();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.byStatus[200]).toBe(1);
    expect(metrics.requests.byEndpoint['/test-api']).toBe(1);
  });

  it('should compute p95 and throughput', () => {
    // Inject some response times
    for (let i = 1; i <= 100; i++) {
      metricsCollector.trackDatabaseOperation(i, true); 
    }
    
    // Manually trigger some middleware runs
    const middleware = metricsCollector.requestMetrics();
    for (let i = 1; i <= 10; i++) {
        const res = { statusCode: 200, on: (e: any, cb: any) => e === 'finish' && cb() } as any;
        middleware({ path: '/' } as any, res, () => {});
    }

    const metrics = metricsCollector.getMetrics();
    expect(metrics.computedMetrics.avgResponseTime).toBeDefined();
    expect(metrics.computedMetrics.p95ResponseTime).toBeDefined();
    expect(metrics.computedMetrics.requestsPerSecond).toBeGreaterThanOrEqual(0);
  });

  it('should reset metrics', () => {
    metricsCollector.trackSecurityEvent('auth_attempt');
    metricsCollector.reset();
    const metrics = metricsCollector.getMetrics();
    expect(metrics.security.authAttempts).toBe(0);
  });
});
