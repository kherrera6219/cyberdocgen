import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EvidenceIngestion from "../../../client/src/pages/evidence-ingestion";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const dropzoneState = vi.hoisted(() => ({
  onDrop: undefined as undefined | ((files: File[]) => void | Promise<void>),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

vi.mock("react-dropzone", () => ({
  useDropzone: (options: { onDrop: (files: File[]) => void | Promise<void> }) => {
    dropzoneState.onDrop = options.onDrop;
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    };
  },
}));

vi.mock("@/components/evidence/SnapshotManager", () => ({
  SnapshotManager: ({
    onSnapshotSelect,
  }: {
    onSnapshotSelect: (id: string, name: string) => void;
  }) => (
    <button
      data-testid="button-select-snapshot"
      onClick={() => onSnapshotSelect("snapshot-1", "Q1 Audit")}
      type="button"
    >
      Select Snapshot
    </button>
  ),
}));

vi.mock("@/components/evidence/WebImportDialog", () => ({
  WebImportDialog: () => <div data-testid="web-import-dialog">Web Import</div>,
}));

class MockFileReader {
  result = "data:application/pdf;base64,ZmFrZQ==";
  onload: ((ev: ProgressEvent<FileReader>) => unknown) | null = null;
  onerror: ((ev: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }
}

describe("EvidenceIngestion interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks upload attempts until a snapshot context is selected", async () => {
    renderWithProviders(<EvidenceIngestion />);

    const file = new File(["sample"], "evidence.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await dropzoneState.onDrop?.([file]);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Action Required",
        variant: "destructive",
      }),
    );
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("uploads files, advances status, and allows queue cleanup", async () => {
    apiRequestMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    renderWithProviders(<EvidenceIngestion />);
    await user.click(screen.getByTestId("button-select-snapshot"));
    await waitFor(() => {
      expect(
        screen.queryByText(/select a snapshot above to enable upload/i),
      ).not.toBeInTheDocument();
    });

    const file = new File(["policy-content"], "policy.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await dropzoneState.onDrop?.([file]);
    });

    expect(await screen.findByText(/upload queue/i)).toBeInTheDocument();
    expect(screen.getByText("policy.pdf")).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/evidence/upload",
        "POST",
        expect.objectContaining({
          fileName: "policy.pdf",
          snapshotId: "snapshot-1",
          category: "Evidence",
        }),
      );
    });

    expect(await screen.findByText("extracting")).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Evidence uploaded",
      }),
    );

    const fileName = screen.getByText("policy.pdf");
    const queueItem = fileName.closest(".flex.items-center.gap-3");
    expect(queueItem).not.toBeNull();
    await user.click(within(queueItem as HTMLElement).getByRole("button"));
    expect(screen.queryByText("policy.pdf")).not.toBeInTheDocument();
  });

  it("marks file status as error when upload fails", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("Upload failed"));
    const user = userEvent.setup();

    renderWithProviders(<EvidenceIngestion />);
    await user.click(screen.getByTestId("button-select-snapshot"));
    await waitFor(() => {
      expect(
        screen.queryByText(/select a snapshot above to enable upload/i),
      ).not.toBeInTheDocument();
    });

    const file = new File(["bad-content"], "broken.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await dropzoneState.onDrop?.([file]);
    });

    expect(await screen.findByText("error")).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Upload failed",
        variant: "destructive",
      }),
    );
  });
});
