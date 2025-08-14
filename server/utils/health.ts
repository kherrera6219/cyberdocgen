import { Request, Response } from "express";
import { db } from "../db";
import { logger } from "./logger";

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

interface HealthCheckResult {
  status: "pass" | "fail" | "warn";
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
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

export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthCheckService.performHealthCheck();
    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Health check failed", { error: error.message });
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      message: "Health check service unavailable",
    });
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