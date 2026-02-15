import { logger } from '../utils/logger';
import { alertingService } from './alertingService';

interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  slowQueries: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface PerformanceServiceOptions {
  enableBackgroundTasks?: boolean;
}

export class PerformanceService {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    slowQueries: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0
  };

  private readonly cache = new Map<string, { data: any; expiry: number; hits: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private startTime = Date.now();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: PerformanceServiceOptions = {}) {
    const enableBackgroundTasks = options.enableBackgroundTasks !== false;
    if (enableBackgroundTasks) {
      this.startPerformanceMonitoring();
      this.startCacheCleanup();
    }
  }

  recordRequest(responseTime: number, isError: boolean, endpoint?: string): void {
    this.metrics.requestCount++;
    this.metrics.errorCount += isError ? 1 : 0;
    this.metrics.totalResponseTime += responseTime;

    // Track endpoint-specific metrics
    if (endpoint) {
      if (!this.endpointMetrics.has(endpoint)) {
        this.endpointMetrics.set(endpoint, {
          requests: 0,
          errors: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0
        });
      }

      const endpointStats = this.endpointMetrics.get(endpoint)!;
      endpointStats.requests++;
      endpointStats.errors += isError ? 1 : 0;
      endpointStats.totalTime += responseTime;
      endpointStats.avgTime = endpointStats.totalTime / endpointStats.requests;
      endpointStats.minTime = Math.min(endpointStats.minTime, responseTime);
      endpointStats.maxTime = Math.max(endpointStats.maxTime, responseTime);
    }

    // Keep errorCount as an absolute counter and publish derived rates separately.
    const errorRate = this.getErrorRate();
    alertingService.updateMetric('error_rate', errorRate);


    // Update average response time
    const avgResponseTime = this.getAverageResponseTime();
    alertingService.updateMetric('avg_response_time', avgResponseTime);

    // Track performance trends
    this.recordPerformanceTrend(responseTime, isError);
  }

  private endpointMetrics = new Map<string, {
    requests: number;
    errors: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }>();

  private performanceTrends: Array<{
    timestamp: Date;
    responseTime: number;
    isError: boolean;
  }> = [];

  private recordPerformanceTrend(responseTime: number, isError: boolean): void {
    this.performanceTrends.push({
      timestamp: new Date(),
      responseTime,
      isError
    });

    // Keep only last 1000 entries
    if (this.performanceTrends.length > 1000) {
      this.performanceTrends.shift();
    }
  }

  getEndpointMetrics(): Map<string, any> {
    return this.endpointMetrics;
  }

  getPerformanceTrends(): any[] {
    return this.performanceTrends.slice(-100); // Last 100 entries
  }

  getDetailedMetrics(): any {
    return {
      ...this.metrics,
      endpoints: Object.fromEntries(this.endpointMetrics),
      trends: this.getPerformanceTrends(),
      healthStatus: this.getHealthStatus()
    };
  }

  private getHealthStatus(): string {
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();

    if (errorRate > 10 || avgResponseTime > 5000) return 'critical';
    if (errorRate > 5 || avgResponseTime > 2000) return 'warning';
    return 'healthy';
  }

  // Intelligent caching with hit tracking
  setCache(key: string, data: any, customTTL?: number): void {
    const ttl = customTTL || this.CACHE_TTL;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      hits: 0
    });
  }

  getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    item.hits++;
    return item.data;
  }

  // Query optimization tracking
  recordSlowQuery(query: string, duration: number) {
    logger.warn('Slow query detected', {
      query: query.substring(0, 100) + '...',
      duration,
      threshold: this.SLOW_QUERY_THRESHOLD
    });

    this.metrics.slowQueries++;
  }

  // Resource monitoring
  private startPerformanceMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = memUsage.heapUsed;

      // CPU usage approximation
      const cpuUsage = process.cpuUsage();
      this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000;

      // Log performance metrics
      logger.info('Performance metrics', {
        requestsPerSecond: this.getRequestsPerSecond(),
        avgResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        cacheHitRate: this.getCacheHitRate(),
        slowQueries: this.metrics.slowQueries
      });

      // Reset counters periodically
      if (this.metrics.requestCount > 10000) {
        this.resetMetrics();
      }
    }, 60000); // Every minute
    this.monitoringInterval.unref?.();
  }

  private startCacheCleanup() {
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of Array.from(this.cache.entries())) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, 300000); // Every 5 minutes
    this.cacheCleanupInterval.unref?.();
  }

  dispose() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  private resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      slowQueries: 0,
      memoryUsage: this.metrics.memoryUsage,
      cpuUsage: this.metrics.cpuUsage,
      activeConnections: this.metrics.activeConnections
    };
  }

  getRequestsPerSecond(): number {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    return this.metrics.requestCount / uptimeSeconds;
  }

  getAverageResponseTime(): number {
    return this.metrics.requestCount > 0
      ? this.metrics.totalResponseTime / this.metrics.requestCount
      : 0;
  }

  getErrorRate(): number {
    return this.metrics.requestCount > 0
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100
      : 0;
  }

  getCacheHitRate(): number {
    let totalRequests = 0;
    let totalHits = 0;

    for (const item of Array.from(this.cache.values())) {
      totalRequests++;
      totalHits += item.hits;
    }

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  getMetrics() {
    return {
      ...this.metrics,
      requestsPerSecond: this.getRequestsPerSecond(),
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      cacheHitRate: this.getCacheHitRate(),
      uptime: Date.now() - this.startTime
    };
  }
}

export const performanceService = new PerformanceService();
