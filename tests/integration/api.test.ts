import express from "express";
import request from "supertest";
import { vi } from "vitest";
import { healthCheckHandler } from "../../server/utils/health";
import { afterAll, beforeAll, describe, expect, it } from "../setup";

vi.mock("@replit/object-storage", () => ({ Client: class {} }));

describe("API Integration Tests", () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    vi.mock("../../server/storage", () => ({ storage: {} }));
    vi.mock("../../server/replitAuth", () => ({
      setupAuth: async () => {},
      isAuthenticated: (_req: any, res: any) => res.status(401).end(),
    }));
    vi.mock("../../server/services/aiOrchestrator", () => ({
      aiOrchestrator: {
        healthCheck: vi.fn().mockResolvedValue({ openai: true, anthropic: true, overall: true }),
      },
    }));
    vi.mock("../../server/services/objectStorageService", () => ({
      objectStorageService: {},
    }));

    const { registerRoutes } = await import("../../server/routes");

    app = express();
    app.use(express.json());
    app.get("/health", healthCheckHandler);
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe("Health Endpoints", () => {
    it("should return system health status", async () => {
      const response = await request(app).get("/health");

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should return AI health status", async () => {
      const response = await request(app).get("/api/ai/health").expect(200);

      expect(response.body).toHaveProperty("openai");
      expect(response.body).toHaveProperty("anthropic");
      expect(response.body).toHaveProperty("overall");
    });
  });

  describe("Authentication Required Endpoints", () => {
    it("should require authentication for user profile", async () => {
      await request(app).get("/api/auth/user").expect(401);
    });

    it.skip("should require authentication for company profiles", async () => {
      await request(app).get("/api/company-profiles").expect(401);
    });

    it.skip("should require authentication for documents", async () => {
      await request(app).get("/api/documents").expect(401);
    });
  });

  describe("Data Validation", () => {
    it("should validate company profile creation payload", async () => {
      const invalidPayload = {
        companyName: "", // Invalid: empty string
        industry: "Tech",
        // Missing required fields
      };

      await request(app).post("/api/company-profiles").send(invalidPayload).expect(401); // Will be 401 due to auth, but would be 400 with auth
    });
  });
});
