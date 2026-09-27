import { describe, it, expect, vi } from "vitest";
import { diagramArchitectureService } from "../../../server/services/diagramArchitectureService";

// Mock analyzeImage from geminiVision to test parsing and graph generation
vi.mock("../../../server/services/geminiVision", () => ({
  analyzeImage: vi.fn().mockResolvedValue({
    analysis: JSON.stringify({
      systemName: "FinTech Banking Core",
      detectedCloudProvider: "AWS",
      nodes: [
        { id: "cf", name: "CloudFront CDN", category: "network_gateway", subnet: "public_dmz" },
        { id: "ecs", name: "ECS Banking Containers", category: "compute", subnet: "private_app" },
        { id: "aurora", name: "Aurora PostgreSQL", category: "database", subnet: "isolated_data" },
      ],
      edges: [
        { from: "cf", to: "ecs", protocol: "HTTPS/443", isEncrypted: true, crossesBoundary: true },
        { from: "ecs", to: "aurora", protocol: "TLS/5432", isEncrypted: true, crossesBoundary: true },
      ],
      trustBoundaries: [
        {
          name: "PCI Cardholder Data Environment (CDE)",
          description: "Isolated boundary for financial payment processing.",
          containedNodeIds: ["ecs", "aurora"],
        },
      ],
      nistSection9SystemArchitecture: "The FinTech Core relies on a segregated 3-tier architecture with CloudFront CDN termination.",
      nistSection10AuthorizationBoundary: "The authorization boundary strictly contains the PCI CDE subnet and Aurora DB cluster.",
    }),
  }),
}));

describe("DiagramArchitectureService", () => {
  it("should extract architecture graph, trust boundaries, and NIST sections from image buffer", async () => {
    const dummyImageBuffer = Buffer.from("fake-image-bytes");
    const result = await diagramArchitectureService.extractArchitectureFromImage(
      dummyImageBuffer,
      "image/png",
      { systemName: "FinTech Banking Core" }
    );

    expect(result.systemName).toBe("FinTech Banking Core");
    expect(result.detectedCloudProvider).toBe("AWS");
    expect(result.nodes.length).toBe(3);
    expect(result.edges.length).toBe(2);
    expect(result.trustBoundaries.length).toBe(1);
    expect(result.trustBoundaries[0].name).toContain("PCI");

    // Check NIST narratives
    expect(result.nistSection9SystemArchitecture).toContain("FinTech Core");
    expect(result.nistSection10AuthorizationBoundary).toContain("PCI CDE");

    // Check generated Mermaid diagram
    expect(result.generatedMermaidDiagram).toContain("graph TD");
    expect(result.generatedMermaidDiagram).toContain("subgraph PUBLIC_DMZ");
    expect(result.generatedMermaidDiagram).toContain("cf -->|\"🔒 HTTPS/443\"| ecs");
  });
});
