import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../server";
import { db } from "../../server/db";
import { cloudFiles, evidenceControlMappings, users, organizations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sign } from "jsonwebtoken";

const describeWithLiveDb =
  process.env.RUN_DB_INTEGRATION_TESTS === "true" ? describe : describe.skip;

describeWithLiveDb("Evidence-to-Control Mapping API (CODE-02)", () => {
  let orgId: string;
  let userId: string;
  let evidenceId: string;
  let token: string;

  beforeAll(async () => {
    // 1. Create a test organization
    const [org] = await db.insert(organizations).values({
      name: "Test Org mapping",
      slug: "test-org-mapping",
    }).returning();
    orgId = org.id;

    // 2. Create a test user
    const [user] = await db.insert(users).values({
      email: "test.mapping@example.com",
      username: "test_mapping_user",
    }).returning();
    userId = user.id;

    // 3. Create a mock evidence file
    const [file] = await db.insert(cloudFiles).values({
      organizationId: orgId,
      integrationId: "manual-upload",
      providerFileId: "test-path/file.pdf",
      fileName: "test-evidence.pdf",
      filePath: "test-path/file.pdf",
      fileType: "pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      snapshotId: "test-snapshot",
      category: "Evidence",
      processingStatus: "completed",
    } as any).returning();
    evidenceId = file.id;

    // 4. Generate auth token
    token = sign(
      { userId, organizationId: orgId },
      process.env.JWT_SECRET || "test-secret"
    );
  });

  afterAll(async () => {
    await db.delete(evidenceControlMappings).where(eq(evidenceControlMappings.organizationId, orgId));
    await db.delete(cloudFiles).where(eq(cloudFiles.organizationId, orgId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
  });

  describe("POST /api/evidence/mappings", () => {
    it("should successfully map an evidence file to a control", async () => {
      const response = await request(app)
        .post("/api/evidence/mappings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          organizationId: orgId,
          evidenceId: evidenceId,
          framework: "SOC2",
          controlId: "CC1.1",
          mappingSource: "manual"
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.evidenceId).toBe(evidenceId);
      expect(response.body.data.framework).toBe("SOC2");
      expect(response.body.data.controlId).toBe("CC1.1");
    });

    it("should return 200 with existing data if mapping already exists", async () => {
      const response = await request(app)
        .post("/api/evidence/mappings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          organizationId: orgId,
          evidenceId: evidenceId,
          framework: "SOC2",
          controlId: "CC1.1"
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Mapping already exists");
    });
  });

  describe("GET /api/evidence/mappings", () => {
    it("should list mappings for the organization", async () => {
      const response = await request(app)
        .get("/api/evidence/mappings")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].evidenceId).toBe(evidenceId);
    });

    it("should filter mappings by framework and controlId", async () => {
      const response = await request(app)
        .get("/api/evidence/mappings?framework=SOC2&controlId=CC1.1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe("DELETE /api/evidence/mappings/:id", () => {
    it("should delete an existing mapping", async () => {
      // Get the mapping ID first
      const getResponse = await request(app)
        .get("/api/evidence/mappings")
        .set("Authorization", `Bearer ${token}`);
      
      const mappingId = getResponse.body.data[0].id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/evidence/mappings/${mappingId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      const verifyResponse = await request(app)
        .get("/api/evidence/mappings")
        .set("Authorization", `Bearer ${token}`);
      
      expect(verifyResponse.body.data.length).toBe(0);
    });
  });
});
