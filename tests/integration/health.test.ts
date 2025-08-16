import express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  healthCheckHandler,
  livenessCheckHandler,
  readinessCheckHandler,
} from "../../server/utils/health";

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

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      if (response.status === 200) {
        expect(response.body).toHaveProperty("uptime");
      }
    });

    it("should include database and performance metrics", async () => {
      const response = await request(app).get("/health");

      expect(response.body).toHaveProperty("database");
      expect(response.body).toHaveProperty("performance");
    });

    it("should return overall status based on checks", async () => {
      const response = await request(app).get("/health");

      expect(["healthy", "unhealthy", "degraded"]).toContain(response.body.status);
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
      const promises = Array.from({ length: 10 }, () => request(app).get("/health"));

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty("status");
      });
    });
  });
});
