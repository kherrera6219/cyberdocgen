import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));
const checkGuardrailsMock = vi.hoisted(() => vi.fn());
const anthropicCreateMock = vi.hoisted(() => vi.fn());
const geminiGenerateContentMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/services/aiGuardrailsService", () => ({
  aiGuardrailsService: {
    checkGuardrails: checkGuardrailsMock,
  },
}));

vi.mock("../../../server/services/aiClients", () => ({
  getAnthropicClient: () => ({
    messages: {
      create: anthropicCreateMock,
    },
  }),
  getGeminiClient: () => ({
    models: {
      generateContent: geminiGenerateContentMock,
    },
  }),
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerAnalyticsRoutes } from "../../../server/routes/analytics";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).organizationId = "11111111-1111-4111-8111-111111111111";
    next();
  });
  const router = express.Router();
  registerAnalyticsRoutes(router);
  app.use("/api/analytics", router);
  return app;
}

describe("analytics routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();

    checkGuardrailsMock.mockResolvedValue({
      allowed: true,
      sanitizedPrompt: "sanitized-input",
      action: "allow",
      severity: "low",
    });

    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "analysis result" }],
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    geminiGenerateContentMock.mockResolvedValue({
      text: "gemini gap analysis",
    });
  });

  it("executes risk, compliance, quality, and chat analysis flows", async () => {
    const risk = await request(app)
      .post("/api/analytics/risk-assessment")
      .send({
        companyProfile: {
          name: "Lucentry",
          industry: "SaaS",
          assets: ["api", "database"],
          threats: ["ransomware"],
        },
      })
      .expect(200);

    expect(risk.body.success).toBe(true);
    expect(risk.body.data.riskAssessment).toBe("analysis result");
    expect(anthropicCreateMock).toHaveBeenCalled();

    const compliance = await request(app)
      .post("/api/analytics/compliance-analysis")
      .send({
        framework: "SOC2",
        currentControls: ["CC1.1"],
        requirements: ["CC1.1", "CC6.1"],
      })
      .expect(200);

    expect(compliance.body.data.gapAnalysis).toBe("gemini gap analysis");
    expect(compliance.body.data.model).toBe("gemini-2.0-flash");
    expect(geminiGenerateContentMock).toHaveBeenCalled();

    const quality = await request(app)
      .post("/api/analytics/analyze-document-quality")
      .send({
        content: "Security policy content for quality review",
        framework: "ISO27001",
        documentType: "Policy",
      })
      .expect(200);

    expect(quality.body.data.qualityAnalysis).toBe("analysis result");

    const chat = await request(app)
      .post("/api/analytics/compliance-chat")
      .send({
        message: "What should we prioritize first?",
        context: "SOC2 readiness",
        framework: "SOC2",
      })
      .expect(200);

    expect(chat.body.data.reply).toBe("analysis result");
    expect(anthropicCreateMock).toHaveBeenCalledTimes(3);
  });

  it("blocks guardrail-failed requests", async () => {
    checkGuardrailsMock.mockResolvedValue({
      allowed: false,
      action: "block",
      severity: "high",
    });

    const riskBlocked = await request(app)
      .post("/api/analytics/risk-assessment")
      .send({ companyProfile: { name: "Blocked Co" } })
      .expect(403);
    expect(riskBlocked.body.error.code).toBe("FORBIDDEN");

    const complianceBlocked = await request(app)
      .post("/api/analytics/compliance-analysis")
      .send({ framework: "SOC2", currentControls: [], requirements: [] })
      .expect(403);
    expect(complianceBlocked.body.error.code).toBe("FORBIDDEN");

    const qualityBlocked = await request(app)
      .post("/api/analytics/analyze-document-quality")
      .send({ content: "Sensitive content", framework: "SOC2", documentType: "Policy" })
      .expect(403);
    expect(qualityBlocked.body.error.code).toBe("FORBIDDEN");

    const chatBlocked = await request(app)
      .post("/api/analytics/compliance-chat")
      .send({ message: "Blocked prompt", framework: "SOC2" })
      .expect(403);
    expect(chatBlocked.body.error.code).toBe("FORBIDDEN");
  });

  it("analyzes compliance gaps and validates missing framework input", async () => {
    const invalid = await request(app).post("/api/analytics/analyze-compliance-gaps").send({}).expect(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");

    const analyzed = await request(app)
      .post("/api/analytics/analyze-compliance-gaps")
      .send({
        framework: "ISO27001",
        currentControls: ["A.5.1", "A.5.3"],
        requirements: ["A.5.1", "A.5.2", "A.5.3", "A.8.1"],
      })
      .expect(200);

    expect(analyzed.body.data.summary.totalRequirements).toBe(4);
    expect(analyzed.body.data.summary.implementedControls).toBe(2);
    expect(analyzed.body.data.summary.gaps).toBe(2);
    expect(analyzed.body.data.summary.compliancePercentage).toBe(50);
    expect(analyzed.body.data.gaps).toEqual(["A.5.2", "A.8.1"]);
    expect(analyzed.body.data.recommendations.length).toBe(3);

    const noGap = await request(app)
      .post("/api/analytics/analyze-compliance-gaps")
      .send({
        framework: "SOC2",
        currentControls: ["CC1.1"],
        requirements: ["CC1.1"],
      })
      .expect(200);

    expect(noGap.body.data.summary.compliancePercentage).toBe(100);
    expect(noGap.body.data.recommendations[0]).toMatch(/currently implemented/i);
  });
});

