import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalErrorHandler } from "../../../server/utils/errorHandling";

const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));

const selectResults = vi.hoisted(() => [] as any[]);
const limitResults = vi.hoisted(() => [] as any[]);
const insertReturningResults = vi.hoisted(() => [] as any[]);
const updateReturningResults = vi.hoisted(() => [] as any[]);

function createSelectChain() {
  const chain: any = {
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(limitResults.shift() ?? [])),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(selectResults.shift() ?? []).then(resolve, reject),
  };
  return chain;
}

const selectMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn(() => createSelectChain()) })));

const insertReturningMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(insertReturningResults.shift() ?? [])),
);
const insertValuesMock = vi.hoisted(() =>
  vi.fn(() => ({
    returning: insertReturningMock,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(undefined).then(resolve, reject),
  })),
);
const insertMock = vi.hoisted(() => vi.fn(() => ({ values: insertValuesMock })));

const updateReturningMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(updateReturningResults.shift() ?? [])),
);
const updateWhereMock = vi.hoisted(() => vi.fn(() => ({ returning: updateReturningMock })));
const updateSetMock = vi.hoisted(() => vi.fn(() => ({ where: updateWhereMock })));
const updateMock = vi.hoisted(() => vi.fn(() => ({ set: updateSetMock })));

const deleteWhereMock = vi.hoisted(() => vi.fn(() => Promise.resolve(undefined)));
const deleteMock = vi.hoisted(() => vi.fn(() => ({ where: deleteWhereMock })));

vi.mock("../../../server/replitAuth", () => ({
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/db", () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import projectsRouter from "../../../server/routes/projects";

describe("projects routes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const projectId = "22222222-2222-4222-8222-222222222222";
  const targetUserId = "33333333-3333-4333-8333-333333333333";
  const memberId = "44444444-4444-4444-8444-444444444444";
  let activeOrgId: string | undefined = orgId;
  let activeOrgRole = "owner";

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).organizationId = activeOrgId;
    (req as any).organizationRole = activeOrgRole;
    next();
  });
  app.use("/api/projects", projectsRouter);
  app.use(globalErrorHandler);

  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    limitResults.length = 0;
    insertReturningResults.length = 0;
    updateReturningResults.length = 0;
    activeOrgId = orgId;
    activeOrgRole = "owner";
  });

  it("lists current user projects and organization projects with membership checks", async () => {
    selectResults.push([
      { id: projectId, name: "Platform Hardening", status: "active", memberRole: "owner" },
    ]);
    const mine = await request(app).get("/api/projects").expect(200);
    expect(mine.body.success).toBe(true);
    expect(mine.body.data).toHaveLength(1);

    limitResults.push([{ id: "membership-1", organizationId: orgId }]);
    selectResults.push([{ id: projectId, organizationId: orgId, name: "Org Program" }]);
    const byOrg = await request(app).get(`/api/projects/organization/${orgId}`).expect(200);
    expect(byOrg.body.data[0].organizationId).toBe(orgId);

    limitResults.push([]);
    const forbidden = await request(app).get("/api/projects/organization/not-member").expect(403);
    expect(forbidden.body.success).toBe(false);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");
  });

  it("gets project details and handles membership/not-found branches", async () => {
    limitResults.push([{ role: "owner" }], [{ id: projectId, name: "Program A" }]);
    const project = await request(app).get(`/api/projects/${projectId}`).expect(200);
    expect(project.body.data.id).toBe(projectId);

    limitResults.push([]);
    const forbidden = await request(app).get("/api/projects/missing-member").expect(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "viewer" }], []);
    const missing = await request(app).get("/api/projects/not-found").expect(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("creates projects and requires organization context", async () => {
    insertReturningResults.push([{ id: projectId, name: "New Project", organizationId: orgId }]);
    const created = await request(app)
      .post("/api/projects")
      .send({
        name: "New Project",
        description: "Initial scope",
        framework: "SOC2",
      });
    expect(created.status).toBe(201);

    expect(created.body.success).toBe(true);
    expect(created.body.data.id).toBe(projectId);
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertValuesMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: "New Project",
        organizationId: orgId,
        createdBy: "user-1",
      }),
    );

    activeOrgId = undefined;
    const noOrg = await request(app).post("/api/projects").send({ name: "No Org" }).expect(403);
    expect(noOrg.body.error.code).toBe("ORG_CONTEXT_REQUIRED");
  });

  it("updates and deletes projects with access control checks", async () => {
    limitResults.push([{ role: "editor" }]);
    updateReturningResults.push([{ id: projectId, status: "active", framework: "SOC2" }]);
    const updated = await request(app)
      .patch(`/api/projects/${projectId}`)
      .send({ status: "active", framework: "SOC2" })
      .expect(200);

    expect(updated.body.data.status).toBe("active");
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        framework: "SOC2",
      }),
    );

    limitResults.push([{ role: "viewer" }]);
    const updateForbidden = await request(app)
      .patch(`/api/projects/${projectId}`)
      .send({ status: "blocked" })
      .expect(403);
    expect(updateForbidden.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }]);
    updateReturningResults.push([]);
    const updateMissing = await request(app)
      .patch(`/api/projects/${projectId}`)
      .send({ status: "blocked" })
      .expect(404);
    expect(updateMissing.body.error.code).toBe("NOT_FOUND");

    limitResults.push([{ role: "editor" }]);
    const deleteForbidden = await request(app).delete(`/api/projects/${projectId}`).expect(403);
    expect(deleteForbidden.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }]);
    const deleted = await request(app).delete(`/api/projects/${projectId}`).expect(200);
    expect(deleted.body.success).toBe(true);
    expect(deleteMock).toHaveBeenCalled();
  });

  it("manages members for add, update, list, and remove workflows", async () => {
    limitResults.push([{ role: "owner" }]);
    selectResults.push([{ id: memberId, userId: targetUserId, role: "viewer" }]);
    const members = await request(app).get(`/api/projects/${projectId}/members`).expect(200);
    expect(members.body.data[0].id).toBe(memberId);

    limitResults.push([]);
    const membersForbidden = await request(app).get(`/api/projects/${projectId}/members`).expect(403);
    expect(membersForbidden.body.error.code).toBe("FORBIDDEN");

    limitResults.push(
      [{ role: "owner" }],
      [{ id: projectId, organizationId: orgId }],
      [{ id: "org-member" }],
      [],
    );
    insertReturningResults.push([{ id: memberId, projectId, userId: targetUserId, role: "editor" }]);
    const added = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .send({ userId: targetUserId, role: "editor" })
      .expect(201);
    expect(added.body.data.role).toBe("editor");

    limitResults.push(
      [{ role: "owner" }],
      [{ id: projectId, organizationId: orgId }],
      [{ id: "org-member" }],
      [{ id: "existing-member" }],
    );
    const conflict = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .send({ userId: targetUserId, role: "viewer" })
      .expect(409);
    expect(conflict.body.error.code).toBe("CONFLICT");

    limitResults.push([{ role: "owner" }], [{ id: projectId, organizationId: orgId }], []);
    const outsideOrg = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .send({ userId: targetUserId, role: "viewer" })
      .expect(403);
    expect(outsideOrg.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }]);
    updateReturningResults.push([{ id: memberId, role: "viewer" }]);
    const memberUpdated = await request(app)
      .patch(`/api/projects/${projectId}/members/${memberId}`)
      .send({ role: "viewer" })
      .expect(200);
    expect(memberUpdated.body.data.role).toBe("viewer");

    limitResults.push([{ role: "owner" }]);
    updateReturningResults.push([]);
    const memberMissing = await request(app)
      .patch(`/api/projects/${projectId}/members/${memberId}`)
      .send({ role: "viewer" })
      .expect(404);
    expect(memberMissing.body.error.code).toBe("NOT_FOUND");

    limitResults.push([{ role: "editor" }]);
    const removeForbidden = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .expect(403);
    expect(removeForbidden.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }], []);
    const removeMissing = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .expect(404);
    expect(removeMissing.body.error.code).toBe("NOT_FOUND");

    limitResults.push([{ role: "owner" }], [{ id: memberId, projectId: "other-project", userId: targetUserId }]);
    const wrongProject = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .expect(403);
    expect(wrongProject.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }], [{ id: memberId, projectId, userId: "user-1" }]);
    const removeSelf = await request(app).delete(`/api/projects/${projectId}/members/${memberId}`).expect(403);
    expect(removeSelf.body.error.code).toBe("FORBIDDEN");

    limitResults.push([{ role: "owner" }], [{ id: memberId, projectId, userId: targetUserId }]);
    const removed = await request(app).delete(`/api/projects/${projectId}/members/${memberId}`).expect(200);
    expect(removed.body.success).toBe(true);
    expect(deleteMock).toHaveBeenCalled();
  });
});
