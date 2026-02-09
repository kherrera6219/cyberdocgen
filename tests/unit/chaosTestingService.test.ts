import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { logger } from "../../server/utils/logger";
import {
  chaosTestingService,
  type ChaosExperiment,
  type ExperimentResult,
} from "../../server/services/chaosTestingService";

function buildExperiment(
  overrides: Partial<ChaosExperiment> = {}
): ChaosExperiment {
  return {
    name: "Test Experiment",
    type: "latency",
    target: "api",
    parameters: {},
    ...overrides,
  };
}

function buildResult(overrides: Partial<ExperimentResult> = {}): ExperimentResult {
  return {
    experimentName: "x",
    success: true,
    startTime: new Date(),
    endTime: new Date(),
    durationMs: 10,
    metrics: {
      requestsTotal: 10,
      requestsSuccessful: 9,
      requestsFailed: 1,
      averageLatencyMs: 100,
      maxLatencyMs: 150,
      errorRate: 0.1,
    },
    observations: [],
    passed: true,
    ...overrides,
  };
}

describe("ChaosTestingService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    (chaosTestingService as any).activeExperiments = new Map();
    (chaosTestingService as any).experimentResults = [];
  });

  it("records successful experiment execution", async () => {
    vi.spyOn(chaosTestingService as any, "executeExperiment").mockResolvedValue({
      metrics: {
        requestsTotal: 10,
        requestsSuccessful: 10,
        requestsFailed: 0,
        averageLatencyMs: 200,
        maxLatencyMs: 300,
        errorRate: 0,
      },
      observations: ["all good"],
      passed: true,
    });

    const result = await chaosTestingService.runExperiment(buildExperiment());

    expect(result.success).toBe(true);
    expect(result.passed).toBe(true);
    expect(chaosTestingService.getExperimentResults()).toHaveLength(1);
    expect(chaosTestingService.getActiveExperiments()).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith(
      "Chaos experiment completed",
      expect.objectContaining({ name: "Test Experiment", passed: true })
    );
  });

  it("records failed experiment execution with failure reason", async () => {
    vi.spyOn(chaosTestingService as any, "executeExperiment").mockRejectedValue(
      new Error("runner crashed")
    );

    const result = await chaosTestingService.runExperiment(buildExperiment());

    expect(result.success).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.failureReason).toBe("runner crashed");
    expect(result.metrics.requestsTotal).toBe(0);
    expect(chaosTestingService.getExperimentResults()).toHaveLength(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Chaos experiment failed",
      expect.objectContaining({ error: "runner crashed" })
    );
  });

  it("returns a failed result for unknown experiment type", async () => {
    const result = await chaosTestingService.runExperiment(
      buildExperiment({ type: "unknown" as any })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toContain("Unknown experiment type");
  });

  it("passes latency experiment when requests succeed", async () => {
    vi.spyOn(chaosTestingService as any, "simulateRequestWithLatency").mockResolvedValue(420);

    const result = await (chaosTestingService as any).runLatencyExperiment(
      buildExperiment({ type: "latency", target: "database", parameters: { delay: 420 } })
    );

    expect(result.passed).toBe(true);
    expect(result.metrics.requestsTotal).toBe(50);
    expect(result.metrics.requestsSuccessful).toBe(50);
    expect(result.observations[0]).toContain("Injecting 420ms latency");
  });

  it("fails latency experiment when too many requests fail", async () => {
    vi.spyOn(chaosTestingService as any, "simulateRequestWithLatency").mockRejectedValue(
      new Error("timeout")
    );

    const result = await (chaosTestingService as any).runLatencyExperiment(
      buildExperiment({ type: "latency" })
    );

    expect(result.passed).toBe(false);
    expect(result.metrics.requestsFailed).toBe(50);
    expect(result.failureReason).toBe("Too many requests failed under latency");
  });

  it("uses default failure errorRate and returns pass/fail by ratio", async () => {
    vi.spyOn(chaosTestingService as any, "simulateRequestWithFailure").mockResolvedValue(
      undefined
    );

    const passedResult = await (chaosTestingService as any).runFailureExperiment(
      buildExperiment({ type: "failure", parameters: {} })
    );
    expect(passedResult.passed).toBe(true);
    expect(passedResult.observations[0]).toContain("50% error rate");

    vi.spyOn(chaosTestingService as any, "simulateRequestWithFailure").mockRejectedValue(
      new Error("simulated failure")
    );

    const failedResult = await (chaosTestingService as any).runFailureExperiment(
      buildExperiment({ type: "failure", parameters: { errorRate: 0.2 } })
    );
    expect(failedResult.passed).toBe(false);
    expect(failedResult.failureReason).toBe("System did not handle failures well");
  });

  it("evaluates timeout, network, and resource experiment thresholds", async () => {
    vi.spyOn(chaosTestingService as any, "simulateRequestWithTimeout").mockResolvedValue(
      undefined
    );
    const timeoutResult = await (chaosTestingService as any).runTimeoutExperiment(
      buildExperiment({ type: "timeout", parameters: { delay: 3000 } })
    );
    expect(timeoutResult.passed).toBe(true);
    expect(timeoutResult.metrics.requestsTotal).toBe(30);

    vi.spyOn(chaosTestingService as any, "simulateNetworkRequest").mockRejectedValue(
      new Error("network down")
    );
    const networkResult = await (chaosTestingService as any).runNetworkExperiment(
      buildExperiment({ type: "network" })
    );
    expect(networkResult.passed).toBe(false);
    expect(networkResult.metrics.requestsFailed).toBe(40);

    vi.spyOn(chaosTestingService as any, "simulateResourceRequest").mockRejectedValue(
      new Error("resource exhausted")
    );
    const resourceResult = await (chaosTestingService as any).runResourceExperiment(
      buildExperiment({ type: "resource", target: "database" })
    );
    expect(resourceResult.passed).toBe(false);
    expect(resourceResult.failureReason).toBe("System could not handle resource pressure");
  });

  it("runs pre-deployment suite and summarizes results", async () => {
    vi.spyOn(chaosTestingService, "runExperiment")
      .mockResolvedValueOnce(buildResult({ experimentName: "e1", passed: true }))
      .mockResolvedValueOnce(buildResult({ experimentName: "e2", passed: false }))
      .mockResolvedValueOnce(buildResult({ experimentName: "e3", passed: true }))
      .mockResolvedValueOnce(buildResult({ experimentName: "e4", passed: false }));

    const suite = await chaosTestingService.runPreDeploymentSuite();

    expect(suite.totalExperiments).toBe(4);
    expect(suite.passedExperiments).toBe(2);
    expect(suite.failedExperiments).toBe(2);
    expect(suite.passed).toBe(false);
  });

  it("simulation helper methods respect failure thresholds", async () => {
    vi.spyOn(chaosTestingService as any, "sleep").mockResolvedValue(undefined);
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy.mockReturnValueOnce(0.1);
    await expect(
      (chaosTestingService as any).simulateRequestWithFailure(0.5)
    ).rejects.toThrow("Simulated failure");

    randomSpy.mockReturnValueOnce(0.9);
    await expect(
      (chaosTestingService as any).simulateRequestWithFailure(0.5)
    ).resolves.toBeUndefined();

    randomSpy.mockReturnValueOnce(0.2);
    await expect(
      (chaosTestingService as any).simulateRequestWithTimeout(1000)
    ).rejects.toThrow("Timeout");

    randomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.2);
    await expect((chaosTestingService as any).simulateNetworkRequest()).rejects.toThrow(
      "Network error"
    );

    randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.1);
    await expect((chaosTestingService as any).simulateResourceRequest()).rejects.toThrow(
      "Resource exhausted"
    );
  });
});
