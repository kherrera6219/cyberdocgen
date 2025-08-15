
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

  constructor() {
    this.startPerformanceMonitoring();
    this.startCacheCleanup();
  }

  recordRequest(responseTime: number, isError: boolean = false) {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.metrics.errorCount++;
    }

    if (responseTime > this.SLOW_QUERY_THRESHOLD) {
      this.metrics.slowQueries++;
    }

    // Calculate and update metrics
    const errorRate = (this.metrics.errorCount / this.metrics.requestCount) * 100;
    const avgResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    alertingService.updateMetric('error_rate', errorRate);
    alertingService.updateMetric('avg_response_time', avgResponseTime);
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
    setInterval(() => {
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
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, 300000); // Every 5 minutes
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
    
    for (const item of this.cache.values()) {
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
