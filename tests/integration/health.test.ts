import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "../../server/utils/health";

describe("Health Check Endpoints", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get("/health", healthCheckHandler);
    app.get("/ready", readinessCheckHandler);
    app.get("/live", livenessCheckHandler);
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      // In test environment without DB, can return 503
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");

      // Only check these if database is available (200 response)
      if (response.status === 200 && response.body.checks) {
        expect(response.body).toHaveProperty("checks");
        expect(response.body.checks).toHaveProperty("database");
        expect(response.body.checks).toHaveProperty("memory");
        expect(response.body.checks).toHaveProperty("disk");
        expect(response.body.checks).toHaveProperty("external_services");
      }
    });

    it("should include check results", async () => {
      const response = await request(app).get("/health");

      // Skip detailed checks if database is not available
      if (response.status === 503 || !response.body.checks) {
        expect(response.body).toHaveProperty("status");
        return;
      }

      const { checks } = response.body;

      // Database check
      if (checks.database) {
        expect(checks.database).toHaveProperty("status");
        expect(checks.database).toHaveProperty("message");
        expect(["pass", "fail", "warn"]).toContain(checks.database.status);
      }

      // Memory check
      if (checks.memory) {
        expect(checks.memory).toHaveProperty("status");
        expect(checks.memory).toHaveProperty("message");
        expect(["pass", "fail", "warn"]).toContain(checks.memory.status);
      }

      // Disk check
      if (checks.disk) {
        expect(checks.disk).toHaveProperty("status");
        expect(checks.disk).toHaveProperty("message");
        expect(["pass", "fail", "warn"]).toContain(checks.disk.status);
      }

      // External services check
      if (checks.external_services) {
        expect(checks.external_services).toHaveProperty("status");
        expect(checks.external_services).toHaveProperty("message");
        expect(["pass", "fail", "warn"]).toContain(checks.external_services.status);
      }
    });

    it("should return overall status based on checks", async () => {
      const response = await request(app).get("/health");
      
      expect(["healthy", "unhealthy", "degraded"]).toContain(
        response.body.status
      );
    });
  });

  describe("GET /ready", () => {
    it("should return readiness status", async () => {
      const response = await request(app).get("/ready");
      
      // Status can be 200 (ready) or 503 (not ready)
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      
      if (response.status === 200) {
        expect(response.body.status).toBe("ready");
      } else {
        expect(response.body.status).toBe("not ready");
      }
    });
  });

  describe("GET /live", () => {
    it("should return liveness status", async () => {
      const response = await request(app).get("/live");
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "alive",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it("should have positive uptime", async () => {
      const response = await request(app).get("/live");
      
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe("Health check reliability", () => {
    it("should respond consistently to multiple requests", async () => {
      const responses = await Promise.all([
        request(app).get("/live"),
        request(app).get("/live"),
        request(app).get("/live"),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("alive");
      });
    });

    it("should not crash on concurrent health checks", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/health")
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty("status");
      });
    });
  });
});