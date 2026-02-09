import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ISO27001Framework from "../../../client/src/pages/iso27001-framework";
import SOC2Framework from "../../../client/src/pages/soc2-framework";
import FedRAMPFramework from "../../../client/src/pages/fedramp-framework";
import NISTFramework from "../../../client/src/pages/nist-framework";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const queryClientMock = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  cancelQueries: vi.fn().mockResolvedValue(undefined),
  getQueryData: vi.fn().mockReturnValue([]),
  setQueryData: vi.fn(),
}));

vi.mock("@/components/compliance/FrameworkSpreadsheet", () => ({
  FrameworkSpreadsheet: () => <div data-testid="framework-spreadsheet">FrameworkSpreadsheet</div>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  queryClient: queryClientMock,
}));

interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string | null;
  createdAt: string;
  metadata: { tags?: string[]; description?: string } | null;
}

function buildEvidence(
  id: string,
  controlId?: string
): EvidenceFile {
  return {
    id,
    fileName: `${id}.pdf`,
    fileType: "pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    downloadUrl: "https://example.com/file.pdf",
    createdAt: "2026-01-01T00:00:00.000Z",
    metadata: controlId ? { tags: [`control:${controlId}`] } : { tags: [] },
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function stubFrameworkEvidenceFetch(data: {
  iso27001?: EvidenceFile[];
  soc2?: EvidenceFile[];
  fedramp?: EvidenceFile[];
  nist?: EvidenceFile[];
}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = resolveUrl(input);

    if (url.includes("framework=iso27001")) {
      const evidence = data.iso27001 ?? [];
      return jsonResponse({ evidence, count: evidence.length });
    }
    if (url.includes("framework=soc2")) {
      const evidence = data.soc2 ?? [];
      return jsonResponse({ evidence, count: evidence.length });
    }
    if (url.includes("framework=fedramp")) {
      const evidence = data.fedramp ?? [];
      return jsonResponse({ evidence, count: evidence.length });
    }
    if (url.includes("framework=nist")) {
      const evidence = data.nist ?? [];
      return jsonResponse({ evidence, count: evidence.length });
    }

    return jsonResponse({ evidence: [], count: 0 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function createFrameworkQueryClient() {
  return createTestQueryClient({
    "/api/company-profiles": [{ id: "profile-1", companyName: "Lucentry" }] as any,
    "/api/frameworks/iso27001/control-statuses": [],
  });
}

async function openAccordion(user: ReturnType<typeof userEvent.setup>, testId: string) {
  const item = await screen.findByTestId(testId);
  await user.click(within(item).getByRole("button"));
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  testId: string,
  optionName: string
) {
  await user.click(screen.getByTestId(testId));
  await user.click(await screen.findByRole("option", { name: optionName }));
}

describe("Framework page interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates and links controls on ISO 27001", async () => {
    const user = userEvent.setup();
    stubFrameworkEvidenceFetch({
      iso27001: [buildEvidence("iso-linked", "A.5.1"), buildEvidence("iso-new")],
    });

    renderWithProviders(<ISO27001Framework />, {
      queryClient: createFrameworkQueryClient(),
    });

    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/iso 27001/i);

    await openAccordion(user, "accordion-domain-A.5");
    await selectOption(user, "select-status-A.5.1", "Implemented");

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/frameworks/iso27001/control-statuses/A.5.1"),
        expect.objectContaining({ method: "PUT" })
      );
    });

    await user.click(screen.getByTestId("button-evidence-A.5.1"));
    expect(await screen.findByText(/Evidence for A\.5\.1/i)).toBeInTheDocument();
    await user.click(screen.getByTestId("button-link-evidence-iso-new"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/evidence/iso-new/controls",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["/api/evidence/iso27001"],
    });
  });

  it("handles SOC 2 status changes and evidence linking", async () => {
    const user = userEvent.setup();
    stubFrameworkEvidenceFetch({
      soc2: [buildEvidence("soc2-linked", "CC1.1"), buildEvidence("soc2-new")],
    });

    renderWithProviders(<SOC2Framework />, {
      queryClient: createFrameworkQueryClient(),
    });

    await openAccordion(user, "accordion-principle-CC");
    await selectOption(user, "select-status-CC1.1", "Implemented");

    expect(screen.getByTestId("text-stat-implemented")).toHaveTextContent("1");
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Control Updated" })
    );

    await user.click(screen.getByTestId("button-evidence-CC1.1"));
    await user.click(await screen.findByTestId("button-link-soc2-new"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/evidence/soc2-new/controls",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("supports FedRAMP filtering, updates, and evidence actions", async () => {
    const user = userEvent.setup();
    stubFrameworkEvidenceFetch({
      fedramp: [buildEvidence("fedramp-linked", "AC-1"), buildEvidence("fedramp-new")],
    });

    renderWithProviders(<FedRAMPFramework />, {
      queryClient: createFrameworkQueryClient(),
    });

    await openAccordion(user, "accordion-family-AC");
    await selectOption(user, "select-status-AC-1", "Implemented");
    expect(screen.getByTestId("text-stat-implemented")).toHaveTextContent("1");

    await user.type(screen.getByTestId("input-search-controls"), "non-existent-control-id");
    expect(await screen.findByText(/No Controls Found/i)).toBeInTheDocument();
    await user.click(screen.getByTestId("button-clear-filters"));

    await user.click(screen.getByTestId("button-evidence-AC-1"));
    await user.click(await screen.findByTestId("button-link-fedramp-new"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/evidence/fedramp-new/controls",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("updates NIST tiers and links evidence", async () => {
    const user = userEvent.setup();
    stubFrameworkEvidenceFetch({
      nist: [buildEvidence("nist-linked", "ID.AM-1"), buildEvidence("nist-new")],
    });

    renderWithProviders(<NISTFramework />, {
      queryClient: createFrameworkQueryClient(),
    });

    await openAccordion(user, "accordion-function-ID");
    await selectOption(user, "select-tier-ID.AM-1", "Tier 3: Repeatable");
    await selectOption(user, "select-status-ID.AM-1", "Implemented");

    expect(screen.getByTestId("text-stat-implemented")).toHaveTextContent("1");
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Implementation Tier Updated" })
    );

    await user.click(screen.getByTestId("button-evidence-ID.AM-1"));
    await user.click(await screen.findByTestId("button-link-nist-new"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/evidence/nist-new/controls",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
