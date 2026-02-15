import { Request, Response, NextFunction } from 'express';

interface ConnectorTypeMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
  lastResponseTime: number;
}

interface Metrics {
  requests: {
    total: number;
    byStatus: Record<number, number>;
    byEndpoint: Record<string, number>;
    responseTimes: number[];
  };
  ai: {
    documentsGenerated: number;
    analysisRequests: number;
    chatbotInteractions: number;
    errorRate: number;
  };
  database: {
    queries: number;
    errors: number;
    avgResponseTime: number;
  };
  security: {
    authAttempts: number;
    failedAuths: number;
    rateLimitHits: number;
  };
  connectors: {
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
    byType: Record<
      string,
      ConnectorTypeMetrics
    >;
  };
  uptime: number;
  startTime: Date;
}

class MetricsCollector {
  private metrics: Metrics;
  private connectorTypeMetrics = new Map<string, ConnectorTypeMetrics>();

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byEndpoint: {},
        responseTimes: []
      },
      ai: {
        documentsGenerated: 0,
        analysisRequests: 0,
        chatbotInteractions: 0,
        errorRate: 0
      },
      database: {
        queries: 0,
        errors: 0,
        avgResponseTime: 0
      },
      security: {
        authAttempts: 0,
        failedAuths: 0,
        rateLimitHits: 0
      },
      connectors: {
        totalRequests: 0,
        totalErrors: 0,
        avgResponseTime: 0,
        byType: {}
      },
      uptime: 0,
      startTime: new Date()
    };
  }

  // Middleware to collect request metrics
  requestMetrics() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Update metrics
        this.metrics.requests.total++;
        this.metrics.requests.byStatus[res.statusCode] = 
          (this.metrics.requests.byStatus[res.statusCode] || 0) + 1;
        this.metrics.requests.byEndpoint[req.path] = 
          (this.metrics.requests.byEndpoint[req.path] || 0) + 1;
        
        // Keep only last 1000 response times for performance
        this.metrics.requests.responseTimes.push(responseTime);
        if (this.metrics.requests.responseTimes.length > 1000) {
          this.metrics.requests.responseTimes.shift();
        }
      });
      
      next();
    };
  }

  // Track AI operations
  trackAIOperation(type: 'generation' | 'analysis' | 'chat' | 'vision_analysis' | 'multimodal_chat', success: boolean = true) {
    switch (type) {
      case 'generation':
        this.metrics.ai.documentsGenerated++;
        break;
      case 'analysis':
      case 'vision_analysis':
        this.metrics.ai.analysisRequests++;
        break;
      case 'chat':
      case 'multimodal_chat':
        this.metrics.ai.chatbotInteractions++;
        break;
    }

    if (!success) {
      this.metrics.ai.errorRate =
        (this.metrics.ai.errorRate * 0.95) + (1 * 0.05); // Exponential moving average
    } else {
      this.metrics.ai.errorRate = this.metrics.ai.errorRate * 0.95;
    }
  }

  // Track database operations
  trackDatabaseOperation(responseTime: number, success: boolean = true) {
    this.metrics.database.queries++;
    
    if (!success) {
      this.metrics.database.errors++;
    }
    
    // Update average response time with exponential moving average
    if (this.metrics.database.avgResponseTime === 0) {
      this.metrics.database.avgResponseTime = responseTime;
    } else {
      this.metrics.database.avgResponseTime = 
        (this.metrics.database.avgResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  // Generic counter utility for legacy call sites
  incrementCounter(_category: string, _label?: string) {
    // Maintain backward compatibility without altering metrics schema significantly
    this.metrics.requests.total++;
  }

  // Track security events
  trackSecurityEvent(type: 'auth_attempt' | 'auth_failure' | 'rate_limit') {
    switch (type) {
      case 'auth_attempt':
        this.metrics.security.authAttempts++;
        break;
      case 'auth_failure':
        this.metrics.security.failedAuths++;
        break;
      case 'rate_limit':
        this.metrics.security.rateLimitHits++;
        break;
    }
  }

  // Track connector API operations
  trackConnectorRequest(type: string, responseTime: number, success: boolean = true) {
    const safeType = typeof type === 'string' && type.trim() ? type.trim().toLowerCase() : 'unknown';
    this.metrics.connectors.totalRequests++;

    if (!success) {
      this.metrics.connectors.totalErrors++;
    }

    if (this.metrics.connectors.avgResponseTime === 0) {
      this.metrics.connectors.avgResponseTime = responseTime;
    } else {
      this.metrics.connectors.avgResponseTime =
        (this.metrics.connectors.avgResponseTime * 0.9) + (responseTime * 0.1);
    }

    if (!this.connectorTypeMetrics.has(safeType)) {
      this.connectorTypeMetrics.set(safeType, {
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        lastResponseTime: 0,
      });
    }

    const connectorMetrics = this.connectorTypeMetrics.get(safeType)!;
    connectorMetrics.requests++;
    connectorMetrics.lastResponseTime = responseTime;
    connectorMetrics.avgResponseTime =
      connectorMetrics.requests === 1
        ? responseTime
        : (connectorMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);

    if (!success) {
      connectorMetrics.errors++;
    }

    this.metrics.connectors.byType = Object.fromEntries(this.connectorTypeMetrics.entries());
  }

  // Get current metrics
  getMetrics(): Metrics & { computedMetrics: any } {
    const now = Date.now();
    const uptime = Math.floor((now - this.metrics.startTime.getTime()) / 1000);
    
    const responseTimes = this.metrics.requests.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const p95ResponseTime = responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
      : 0;

    const serverErrors = Object.keys(this.metrics.requests.byStatus)
      .filter(status => Number(status) >= 500)
      .reduce((acc, status) => acc + this.metrics.requests.byStatus[Number(status)], 0);

    return {
      ...this.metrics,
      uptime,
      computedMetrics: {
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime,
        requestsPerSecond: uptime > 0 ? (this.metrics.requests.total / uptime) : 0,
        errorRate: this.metrics.requests.total > 0 
          ? (serverErrors / this.metrics.requests.total) * 100
          : 0,
        connectorErrorRate: this.metrics.connectors.totalRequests > 0
          ? (this.metrics.connectors.totalErrors / this.metrics.connectors.totalRequests) * 100
          : 0,
        authFailureRate: this.metrics.security.authAttempts > 0
          ? (this.metrics.security.failedAuths / this.metrics.security.authAttempts) * 100
          : 0
      }
    };
  }

  // Reset metrics (for testing or periodic resets)
  reset() {
    this.connectorTypeMetrics.clear();
    this.metrics = {
      requests: { total: 0, byStatus: {}, byEndpoint: {}, responseTimes: [] },
      ai: { documentsGenerated: 0, analysisRequests: 0, chatbotInteractions: 0, errorRate: 0 },
      database: { queries: 0, errors: 0, avgResponseTime: 0 },
      security: { authAttempts: 0, failedAuths: 0, rateLimitHits: 0 },
      connectors: { totalRequests: 0, totalErrors: 0, avgResponseTime: 0, byType: {} },
      uptime: 0,
      startTime: new Date()
    };
  }
}

export const metricsCollector = new MetricsCollector();
export type { Metrics };
