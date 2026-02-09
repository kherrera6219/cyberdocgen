import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));
const getDocumentApprovalsMock = vi.hoisted(() => vi.fn());
const getDocumentApprovalMock = vi.hoisted(() => vi.fn());
const updateDocumentApprovalMock = vi.hoisted(() => vi.fn());
const getDocumentMock = vi.hoisted(() => vi.fn());
const getCompanyProfileMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/storage", () => ({
  storage: {
    getDocumentApprovals: getDocumentApprovalsMock,
    getDocumentApproval: getDocumentApprovalMock,
    updateDocumentApproval: updateDocumentApprovalMock,
    getDocument: getDocumentMock,
    getCompanyProfile: getCompanyProfileMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerApprovalsRoutes } from "../../../server/routes/approvals";
import { globalErrorHandler } from "../../../server/utils/errorHandling";

describe("approvals routes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const otherOrgId = "22222222-2222-4222-8222-222222222222";
  let activeOrgId: string | undefined = orgId;

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).organizationId = activeOrgId;
    next();
  });
  const router = express.Router();
  registerApprovalsRoutes(router);
  app.use("/api/approvals", router);
  app.use(globalErrorHandler);

  beforeEach(() => {
    vi.clearAllMocks();
    activeOrgId = orgId;

    getDocumentApprovalsMock.mockResolvedValue([
      { id: "approval-1", documentId: "doc-1", status: "pending", comments: "Please review" },
      { id: "approval-2", documentId: "doc-2", status: "pending", comments: "Cross tenant" },
    ]);

    getDocumentMock.mockImplementation(async (documentId: string) => {
      if (documentId === "doc-1") {
        return { id: "doc-1", title: "SOC2 Policy", framework: "SOC2", companyProfileId: "profile-1" };
      }
      return { id: "doc-2", title: "ISO Checklist", framework: "ISO27001", companyProfileId: "profile-2" };
    });

    getCompanyProfileMock.mockImplementation(async (profileId: string) => {
      if (profileId === "profile-1") {
        return { id: "profile-1", organizationId: orgId };
      }
      return { id: "profile-2", organizationId: otherOrgId };
    });

    getDocumentApprovalMock.mockResolvedValue({
      id: "approval-1",
      documentId: "doc-1",
      status: "pending",
      comments: "Initial review",
    });

    updateDocumentApprovalMock.mockResolvedValue({
      id: "approval-1",
      documentId: "doc-1",
      status: "approved",
      comments: "Looks good",
    });
  });

  it("lists approvals by organization and returns a single approval detail", async () => {
    const list = await request(app).get("/api/approvals?status=pending").expect(200);
    expect(list.body.success).toBe(true);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].documentTitle).toBe("SOC2 Policy");
    expect(getDocumentApprovalsMock).toHaveBeenCalledWith("pending");

    const detail = await request(app).get("/api/approvals/approval-1").expect(200);
    expect(detail.body.data.id).toBe("approval-1");
    expect(detail.body.data.documentFramework).toBe("SOC2");

    getDocumentApprovalMock.mockResolvedValueOnce(null);
    const missing = await request(app).get("/api/approvals/missing-approval").expect(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("approves and rejects approvals with authorization checks", async () => {
    updateDocumentApprovalMock.mockResolvedValueOnce({
      id: "approval-1",
      status: "approved",
      comments: "Looks good",
    });
    const approved = await request(app)
      .post("/api/approvals/approval-1/approve")
      .send({ comment: "Looks good" })
      .expect(200);

    expect(approved.body.data.status).toBe("approved");
    expect(updateDocumentApprovalMock).toHaveBeenCalledWith(
      "approval-1",
      expect.objectContaining({
        status: "approved",
        comments: "Looks good",
      }),
    );

    getDocumentApprovalMock.mockResolvedValueOnce({
      id: "approval-1",
      documentId: "doc-1",
      status: "pending",
      comments: "Existing comment",
    });
    updateDocumentApprovalMock.mockResolvedValueOnce({
      id: "approval-1",
      status: "rejected",
      comments: "Existing comment",
    });
    const rejected = await request(app).post("/api/approvals/approval-1/reject").send({}).expect(200);
    expect(rejected.body.data.status).toBe("rejected");
    expect(updateDocumentApprovalMock).toHaveBeenCalledWith(
      "approval-1",
      expect.objectContaining({
        status: "rejected",
        comments: "Existing comment",
      }),
    );

    getDocumentApprovalMock.mockResolvedValueOnce(null);
    const missing = await request(app).post("/api/approvals/missing/approve").send({}).expect(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    getDocumentApprovalMock.mockResolvedValueOnce({
      id: "approval-2",
      documentId: "doc-2",
      status: "pending",
      comments: "Cross tenant",
    });
    const unauthorized = await request(app).post("/api/approvals/approval-2/reject").send({}).expect(404);
    expect(unauthorized.body.error.code).toBe("NOT_FOUND");
  });

  it("requires organization context", async () => {
    activeOrgId = undefined;
    const missingOrg = await request(app).get("/api/approvals").expect(403);
    expect(missingOrg.body.error.code).toBe("ORG_CONTEXT_REQUIRED");
  });
});

