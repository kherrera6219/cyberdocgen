import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => {
  const selectQueue: unknown[] = [];
  const returningQueue: unknown[] = [];

  const selectChain: any = {
    from: vi.fn(() => selectChain),
    where: vi.fn(() => selectChain),
    limit: vi.fn(() => selectChain),
    orderBy: vi.fn(() => selectChain),
    offset: vi.fn(() => selectChain),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(selectQueue.length > 0 ? selectQueue.shift() : []).then(resolve, reject),
  };

  const insertChain: any = {
    values: vi.fn(() => insertChain),
    returning: vi.fn(() =>
      Promise.resolve(returningQueue.length > 0 ? returningQueue.shift() : [])
    ),
  };

  const updateChain: any = {
    set: vi.fn(() => updateChain),
    where: vi.fn(() => updateChain),
    returning: vi.fn(() =>
      Promise.resolve(returningQueue.length > 0 ? returningQueue.shift() : [])
    ),
  };

  return {
    select: vi.fn(() => selectChain),
    insert: vi.fn(() => insertChain),
    update: vi.fn(() => updateChain),
    __pushSelectResult: (value: unknown) => selectQueue.push(value),
    __pushReturningResult: (value: unknown) => returningQueue.push(value),
    __selectChain: selectChain,
    __insertChain: insertChain,
    __updateChain: updateChain,
  };
});

vi.mock("../../server/db", () => ({
  db: mockDb,
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { logger } from "../../server/utils/logger";
import { modelTransparencyService } from "../../server/services/modelTransparencyService";

describe("ModelTransparencyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing model card", async () => {
    mockDb.__pushSelectResult([{ id: "card-1" }]);
    mockDb.__pushReturningResult([
      {
        id: "card-1",
        modelProvider: "openai",
        modelName: "gpt-5.1",
        modelVersion: "2024-08-06",
      },
    ]);

    const result = await modelTransparencyService.upsertModelCard({
      modelProvider: "openai",
      modelName: "gpt-5.1",
      modelVersion: "2024-08-06",
      description: "Updated card",
      intendedUse: "Testing",
      limitations: "None",
    });

    expect(result.id).toBe("card-1");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(mockDb.__updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Updated card",
        updatedAt: expect.any(Date),
        lastReviewedAt: expect.any(Date),
      })
    );
  });

  it("creates a new model card when one does not exist", async () => {
    mockDb.__pushSelectResult([]);
    mockDb.__pushReturningResult([
      {
        id: "card-2",
        modelProvider: "anthropic",
        modelName: "claude-3-5-sonnet",
        modelVersion: "20241022",
      },
    ]);

    const result = await modelTransparencyService.upsertModelCard({
      modelProvider: "anthropic",
      modelName: "claude-3-5-sonnet",
      modelVersion: "20241022",
      description: "New card",
      intendedUse: "Compliance automation",
      limitations: "Review required",
    });

    expect(result.id).toBe("card-2");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.__insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        publishedAt: expect.any(Date),
      })
    );
  });

  it("returns null when getModelCard fails", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("database unavailable");
    });

    const result = await modelTransparencyService.getModelCard("openai", "gpt-5.1");

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch model card",
      expect.objectContaining({ error: "database unavailable" })
    );
  });

  it("records a usage disclosure with model card lookup and defaults", async () => {
    vi.spyOn(modelTransparencyService, "getModelCard").mockResolvedValue({
      id: "card-123",
    } as any);
    mockDb.__pushReturningResult([
      {
        id: "disclosure-1",
        userId: "user-1",
      },
    ]);

    const result = await modelTransparencyService.recordUsageDisclosure({
      userId: "user-1",
      actionType: "generate_document",
      modelProvider: "openai",
      modelName: "gpt-5.1",
      purposeDescription: "Generate a policy",
      aiContribution: "assisted",
      userConsented: true,
      costEstimate: 1.23,
    });

    expect(result.id).toBe("disclosure-1");
    expect(mockDb.__insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        modelCardId: "card-123",
        dataUsed: [],
        userConsented: true,
        consentedAt: expect.any(Date),
        humanOversight: false,
        costEstimate: "1.23",
      })
    );
  });

  it("records a usage disclosure without consent timestamp when not consented", async () => {
    vi.spyOn(modelTransparencyService, "getModelCard").mockResolvedValue(null);
    mockDb.__pushReturningResult([
      {
        id: "disclosure-2",
        userId: "user-2",
      },
    ]);

    await modelTransparencyService.recordUsageDisclosure({
      userId: "user-2",
      actionType: "risk_assessment",
      modelProvider: "anthropic",
      modelName: "claude-3-5-sonnet",
      purposeDescription: "Assess risk",
      aiContribution: "partial",
    });

    expect(mockDb.__insertChain.values).toHaveBeenLastCalledWith(
      expect.objectContaining({
        modelCardId: undefined,
        userConsented: false,
        consentedAt: null,
        dataUsed: [],
      })
    );
  });

  it("supports limit and offset for user disclosures", async () => {
    mockDb.__pushSelectResult([{ id: "d-1" }]);

    const result = await modelTransparencyService.getUserDisclosures("user-1", {
      limit: 5,
      offset: 10,
    });

    expect(result).toEqual([{ id: "d-1" }]);
    expect(mockDb.__selectChain.limit).toHaveBeenCalledWith(5);
    expect(mockDb.__selectChain.offset).toHaveBeenCalledWith(10);
  });

  it("returns empty array when organization disclosure query fails", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("query failed");
    });

    const result = await modelTransparencyService.getOrganizationDisclosures("org-1");

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch organization disclosures",
      expect.objectContaining({ error: "query failed", organizationId: "org-1" })
    );
  });

  it("initializes default cards and continues if one upsert fails", async () => {
    const upsertSpy = vi
      .spyOn(modelTransparencyService, "upsertModelCard")
      .mockResolvedValueOnce({ id: "ok-1" } as any)
      .mockRejectedValueOnce(new Error("provider unavailable"));

    await modelTransparencyService.initializeDefaultModelCards();

    expect(upsertSpy).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to initialize default model card",
      expect.objectContaining({ modelProvider: "anthropic" })
    );
    expect(logger.info).toHaveBeenCalledWith("Default model cards initialized");
  });
});
