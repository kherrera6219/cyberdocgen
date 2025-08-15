import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { logger } from './logger';
import { db } from '../db';
import { performanceService } from '../services/performanceService';

interface HealthCheckResult {
  status: "pass" | "fail" | "warn";
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
    external_services: HealthCheckResult;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: boolean;
    redis?: boolean;
    external_apis: boolean;
    ai_services: boolean;
    encryption: boolean;
    audit_system: boolean;
    security_services: boolean;
  };
  performance: {
    responseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  security: {
    activeThreats: number;
    blockedRequests: number;
    suspiciousIPs: number;
  };
  alerts: {
    active: number;
    critical: number;
  };
}

class HealthCheckService {
  private startTime = Date.now();

  async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      await db.execute('SELECT 1');
      const responseTime = Date.now() - start;

      return {
        status: responseTime > 1000 ? "warn" : "pass",
        message: responseTime > 1000 ? "Database responding slowly" : "Database connection healthy",
        responseTime,
      };
    } catch (error) {
      logger.error("Database health check failed", { error: error.message });
      return {
        status: "fail",
        message: "Database connection failed",
        details: { error: error.message },
      };
    }
  }

  checkMemory(): HealthCheckResult {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    return {
      status: memoryUsagePercent > 85 ? "warn" : "pass",
      message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${memoryUsagePercent.toFixed(1)}%)`,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        usagePercent: memoryUsagePercent,
      },
    };
  }

  checkDisk(): HealthCheckResult {
    // Simplified disk check - in production, use proper disk space monitoring
    return {
      status: "pass",
      message: "Disk space monitoring not implemented in development",
    };
  }

  async checkExternalServices(): Promise<HealthCheckResult> {
    const services = [];

    // Check OpenAI API if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        services.push({
          name: "OpenAI",
          status: response.ok ? "pass" : "fail",
        });
      } catch {
        services.push({
          name: "OpenAI",
          status: "fail",
        });
      }
    }

    const failedServices = services.filter(s => s.status === "fail");

    return {
      status: failedServices.length > 0 ? "warn" : "pass",
      message: failedServices.length > 0
        ? `${failedServices.length} external service(s) unavailable`
        : "All external services healthy",
      details: { services },
    };
  }

  async performHealthCheck(): Promise<HealthCheck> {
    const [database, memory, disk, external_services] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkMemory()),
      Promise.resolve(this.checkDisk()),
      this.checkExternalServices(),
    ]);

    const checks = { database, memory, disk, external_services };
    const hasFailures = Object.values(checks).some(check => check.status === "fail");
    const hasWarnings = Object.values(checks).some(check => check.status === "warn");

    return {
      status: hasFailures ? "unhealthy" : hasWarnings ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      uptime: Date.now() - this.startTime,
      checks,
    };
  }
}

const healthCheckService = new HealthCheckService();

export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const dbStatus = await checkDatabaseHealth();
    const performanceMetrics = performanceService.getDetailedMetrics();

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      database: dbStatus,
      performance: {
        requests: performanceMetrics.requests,
        responseTime: performanceMetrics.responseTime,
        healthStatus: performanceMetrics.healthStatus
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      environment: process.env.NODE_ENV,
      features: {
        mfa: process.env.MFA_ENABLED === 'true',
        encryption: !!process.env.ENCRYPTION_KEY,
        auditLogging: true,
        threatDetection: true
      }
    };

    // Determine overall health
    const isHealthy = dbStatus.connected && 
                     performanceMetrics.healthStatus !== 'critical' &&
                     process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.9;

    if (!isHealthy) {
      return res.status(503).json({ ...status, status: 'unhealthy' });
    }

    res.status(200).json(status);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkDatabaseHealth(): Promise<{ connected: boolean; latency?: number }> {
  try {
    const start = Date.now();
    // Simple query to test database connectivity
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch (error) {
    return { connected: false };
  }
}

export async function readinessCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const dbCheck = await healthCheckService.checkDatabase();
    if (dbCheck.status === "fail") {
      res.status(503).json({
        status: "not ready",
        message: "Database not ready",
      });
      return;
    }

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      message: "Service not ready",
    });
  }
}

export async function livenessCheckHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Date.now() - healthCheckService["startTime"],
  });
}

async function checkExternalAPIs(): Promise<boolean> {
  try {
    // Add actual API health checks here
    return true;
  } catch (error) {
    logger.error('External API health check failed:', error);
    return false;
  }
}

async function checkAIServices(): Promise<boolean> {
  try {
    const { aiOrchestrator } = await import('../services/aiOrchestrator');
    const healthStatus = await aiOrchestrator.healthCheck();
    return healthStatus.overall;
  } catch (error) {
    logger.error('AI services health check failed:', error);
    return false;
  }
}

async function checkEncryption(): Promise<boolean> {
  try {
    const { encryptionService } = await import('../services/encryption');
    // Test encryption/decryption cycle
    const testData = 'health-check-test';
    const encrypted = await encryptionService.encryptSensitiveField(testData, 'CONFIDENTIAL');
    const decrypted = await encryptionService.decryptSensitiveField(encrypted);
    return decrypted === testData;
  } catch (error) {
    logger.error('Encryption service health check failed:', error);
    return false;
  }
}

async function checkAuditSystem(): Promise<boolean> {
  try {
    const { auditService } = await import('../services/auditService');
    // Test audit logging
    await auditService.logAuditEvent({
      userId: 'system',
      action: 'CREATE',
      resourceType: 'health_check',
      resourceId: 'test',
      ipAddress: '127.0.0.1',
      riskLevel: 'LOW',
      additionalContext: { type: 'health_check' }
    });
    return true;
  } catch (error) {
    logger.error('Audit system health check failed:', error);
    return false;
  }
}

async function checkSecurityServices(): Promise<boolean> {
  try {
    const { threatDetectionService } = await import('../services/threatDetectionService');
    const metrics = threatDetectionService.getSecurityMetrics();
    return typeof metrics.totalEvents === 'number';
  } catch (error) {
    logger.error('Security services health check failed:', error);
    return false;
  }
}