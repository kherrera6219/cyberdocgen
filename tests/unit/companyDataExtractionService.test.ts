import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.hoisted(() => vi.fn());
const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock("../../server/services/aiOrchestrator", () => ({
  aiOrchestrator: {
    generateContent: generateContentMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: loggerErrorMock,
  },
}));

import { companyDataExtractionService } from "../../server/services/companyDataExtractionService";

describe("companyDataExtractionService", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    generateContentMock.mockResolvedValue({
      result: {
        content: JSON.stringify({
          companyName: "Lucentry.AI",
          industry: "Security",
          keyPersonnel: { ceo: { name: "Kevin Herrera" } },
        }),
      },
    });
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("extracts structured data from documents", async () => {
    generateContentMock.mockResolvedValueOnce({
      result: {
        content: "```json\n{\"companyName\":\"Lucentry.AI\",\"industry\":\"Security\"}\n```",
      },
    });

    const extracted = await companyDataExtractionService.extractFromDocument({
      documentContent: "Company name: Lucentry.AI\nIndustry: Security",
      documentType: "profile",
      filename: "company-profile.txt",
    });

    expect(extracted.companyName).toBe("Lucentry.AI");
    expect(extracted.industry).toBe("Security");
    expect(extracted.confidence).toBe(0.8);
    expect(extracted.source).toBe("document");
    expect(extracted.extractedAt).toBeTruthy();
  });

  it("returns fallback document data when AI response is invalid", async () => {
    generateContentMock.mockResolvedValueOnce({
      result: {
        content: "{ not-valid-json",
      },
    });

    const fallback = await companyDataExtractionService.extractFromDocument({
      documentContent: "invalid extraction",
      documentType: "policy",
      filename: "policy.txt",
    });

    expect(fallback.confidence).toBe(0);
    expect(fallback.source).toBe("document");
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  it("extracts from provided website html and from fetched website html", async () => {
    generateContentMock.mockResolvedValueOnce({
      result: {
        content: JSON.stringify({
          companyName: "Website Co",
          productsAndServices: { primaryServices: [{ name: "Consulting" }] },
        }),
      },
    });

    const fromProvidedHtml = await companyDataExtractionService.extractFromWebsite({
      url: "https://example.com",
      htmlContent:
        "<html><body><script>ignoreMe()</script><h1>Website Co</h1><p>Consulting &amp; Security</p></body></html>",
    });

    expect(fromProvidedHtml.companyName).toBe("Website Co");
    expect(fromProvidedHtml.websiteUrl).toBe("https://example.com");
    expect(fromProvidedHtml.source).toBe("website");
    expect(fromProvidedHtml.confidence).toBe(0.7);

    fetchMock.mockResolvedValueOnce({
      text: vi.fn().mockResolvedValue("<html><body><h1>Fetched Co</h1></body></html>"),
    } as any);
    generateContentMock.mockResolvedValueOnce({
      result: {
        content: JSON.stringify({ companyName: "Fetched Co" }),
      },
    });

    const fetched = await companyDataExtractionService.extractFromWebsite({
      url: "https://fetched.example.com",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://fetched.example.com", expect.any(Object));
    expect(fetched.companyName).toBe("Fetched Co");
    expect(fetched.websiteUrl).toBe("https://fetched.example.com");
  });

  it("returns website fallback when fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const fallback = await companyDataExtractionService.extractFromWebsite({
      url: "https://down.example.com",
    });

    expect(fallback.websiteUrl).toBe("https://down.example.com");
    expect(fallback.confidence).toBe(0);
    expect(fallback.source).toBe("website");
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  it("maps research confidence from data quality and handles failures", async () => {
    generateContentMock.mockResolvedValueOnce({
      result: {
        content: JSON.stringify({
          companyName: "Known Corp",
          dataQuality: "high",
        }),
      },
    });
    const high = await companyDataExtractionService.researchCompany({ companyName: "Known Corp" });
    expect(high.confidence).toBe(0.9);
    expect(high.source).toBe("research");

    generateContentMock.mockResolvedValueOnce({
      result: {
        content: JSON.stringify({
          companyName: "Unknown Corp",
          dataQuality: "unexpected-value",
        }),
      },
    });
    const unknownMap = await companyDataExtractionService.researchCompany({ companyName: "Unknown Corp" });
    expect(unknownMap.confidence).toBe(0.3);

    generateContentMock.mockRejectedValueOnce(new Error("provider failure"));
    const fallback = await companyDataExtractionService.researchCompany({ companyName: "Failed Corp" });
    expect(fallback.companyName).toBe("Failed Corp");
    expect(fallback.confidence).toBe(0);
    expect(fallback.source).toBe("research");
  });

  it("merges extracted data with nested object and array deduping rules", () => {
    const merged = companyDataExtractionService.mergeExtractedData(
      {
        companyName: "Lucentry",
        confidence: 0.4,
        geographicOperations: {
          countriesOfOperation: ["US"],
        },
        productsAndServices: {
          customerSegments: ["Enterprise"],
        },
      },
      {
        companyName: "Lucentry.AI",
        confidence: 0.8,
        source: "website",
        extractedAt: "2026-02-09T00:00:00.000Z",
        geographicOperations: {
          countriesOfOperation: ["US", "CA"],
        },
        productsAndServices: {
          customerSegments: ["Enterprise", "Government"],
        },
      },
    );

    expect(merged.companyName).toBe("Lucentry");
    expect(merged.confidence).toBe(0.8);
    expect(merged.source).toBe("website");
    expect(merged.geographicOperations?.countriesOfOperation).toEqual(["US", "CA"]);
    expect(merged.productsAndServices?.customerSegments).toEqual(["Enterprise", "Government"]);
  });
});

