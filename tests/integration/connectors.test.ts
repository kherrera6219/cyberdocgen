import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { connectorRouter } from "../../server/routes/connectors";

const { authState, mockConnectorService } = vi.hoisted(() => ({
  authState: {
    userId: "test-user-id",
    organizationId: "test-org-id",
  },
  mockConnectorService: {
    getConfigs: vi.fn(),
    createConfig: vi.fn(),
    runImport: vi.fn(),
  },
}));

vi.mock("../../server/services/connectorService", () => ({
  connectorService: mockConnectorService,
}));

vi.mock("../../server/replitAuth", () => ({
  isAuthenticated: (req: any, _res: any, next: any) => {
    req.session = {};
    if (authState.userId) {
      req.user = {
        id: authState.userId,
        organizationId: authState.organizationId || undefined,
      };
      req.session.user = {
        id: authState.userId,
        organizationId: authState.organizationId || undefined,
      };
    }
    if (authState.organizationId) {
      req.session.organizationId = authState.organizationId;
    }
    next();
  },
}));

vi.mock("../../server/middleware/multiTenant", () => ({
  requireOrganization: (req: any, _res: any, next: any) => {
    if (authState.organizationId) {
      req.organizationId = authState.organizationId;
    }
    next();
  },
}));

describe("Connector Routes Integration", () => {
  let app: express.Express;

  beforeEach(() => {
    authState.userId = "test-user-id";
    authState.organizationId = "test-org-id";
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/api/connectors", connectorRouter);
  });

  it("returns connector configs for active organization", async () => {
    mockConnectorService.getConfigs.mockResolvedValueOnce([
      { id: "connector-1", name: "Jira Tickets" },
    ]);

    const response = await request(app).get("/api/connectors");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ id: "connector-1", name: "Jira Tickets" }],
    });
    expect(mockConnectorService.getConfigs).toHaveBeenCalledWith("test-org-id");
  });

  it("creates a connector and binds it to request organization", async () => {
    mockConnectorService.createConfig.mockResolvedValueOnce({
      id: "connector-2",
      name: "Confluence Pages",
    });

    const response = await request(app).post("/api/connectors").send({
      integrationId: "integration-1",
      name: "Confluence Pages",
      connectorType: "notion",
      scopeConfig: {
        pageIds: ["page-1"],
      },
      organizationId: "attempted-override",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: "connector-2", name: "Confluence Pages" },
    });
    expect(mockConnectorService.createConfig).toHaveBeenCalledWith(
      "test-user-id",
      "test-org-id",
      "integration-1",
      "Confluence Pages",
      "notion",
      { pageIds: ["page-1"] },
      expect.any(String),
    );
  });

  it("returns validation error when create payload is invalid", async () => {
    const response = await request(app).post("/api/connectors").send({
      integrationId: "integration-1",
      connectorType: "jira",
      scopeConfig: {},
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(mockConnectorService.createConfig).not.toHaveBeenCalled();
  });

  it("runs connector import with snapshot context", async () => {
    mockConnectorService.runImport.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post("/api/connectors/connector-1/import")
      .send({ snapshotId: "snapshot-1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Import completed successfully" });
    expect(mockConnectorService.runImport).toHaveBeenCalledWith(
      "test-user-id",
      "test-org-id",
      "connector-1",
      "snapshot-1",
      expect.any(String),
    );
  });

  it("returns 400 when import request is missing snapshotId", async () => {
    const response = await request(app).post("/api/connectors/connector-1/import").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(mockConnectorService.runImport).not.toHaveBeenCalled();
  });

  it("returns 401 when user context is missing", async () => {
    authState.userId = "";

    const response = await request(app).post("/api/connectors").send({
      integrationId: "integration-1",
      name: "Drive Files",
      connectorType: "sharepoint",
      scopeConfig: {},
    });

    expect(response.status).toBe(401);
    expect(mockConnectorService.createConfig).not.toHaveBeenCalled();
  });

  it("returns 400 when organization context is missing", async () => {
    authState.organizationId = "";

    const response = await request(app).get("/api/connectors");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Organization context required" });
    expect(mockConnectorService.getConfigs).not.toHaveBeenCalled();
  });
});
