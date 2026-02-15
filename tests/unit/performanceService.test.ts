import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../server/services/alertingService", () => ({
  alertingService: {
    updateMetric: vi.fn(),
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { alertingService } from "../../server/services/alertingService";
import { PerformanceService } from "../../server/services/performanceService";

describe("PerformanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps request and error counters as absolute values", () => {
    const service = new PerformanceService({ enableBackgroundTasks: false });

    service.recordRequest(100, false, "/api/test");
    service.recordRequest(300, true, "/api/test");

    const metrics = service.getMetrics();
    expect(metrics.requestCount).toBe(2);
    expect(metrics.errorCount).toBe(1);
    expect(metrics.averageResponseTime).toBe(200);
    expect(metrics.errorRate).toBe(50);

    expect(alertingService.updateMetric).toHaveBeenCalledWith("error_rate", 50);
    expect(alertingService.updateMetric).toHaveBeenCalledWith("avg_response_time", 200);

    const endpointMetrics = service.getEndpointMetrics().get("/api/test");
    expect(endpointMetrics).toMatchObject({
      requests: 2,
      errors: 1,
      avgTime: 200,
      minTime: 100,
      maxTime: 300,
    });
  });

  it("computes health status from derived rates", () => {
    const service = new PerformanceService({ enableBackgroundTasks: false });

    service.recordRequest(50, true);
    service.recordRequest(50, false);

    const detailed = service.getDetailedMetrics();
    expect(detailed.healthStatus).toBe("critical");
  });

  it("does not schedule background timers when disabled", () => {
    vi.useFakeTimers();

    const service = new PerformanceService({ enableBackgroundTasks: false });
    expect(vi.getTimerCount()).toBe(0);

    service.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});

