import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepoUploadZone } from "../../../client/src/components/repository/RepoUploadZone";
import { renderWithProviders } from "../utils/renderWithProviders";

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!input) {
    throw new Error("File input not found");
  }
  return input as HTMLInputElement;
}

describe("RepoUploadZone interactions", () => {
  it("rejects invalid file types", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <RepoUploadZone
        onUpload={onUpload}
        organizationId="org-1"
        companyProfileId="profile-1"
        maxSize={1}
      />
    );

    const input = getFileInput(container);
    const txtFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [txtFile] } });
    expect(await screen.findByText(/Only \.zip files are allowed/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("rejects oversized zip files", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <RepoUploadZone
        onUpload={onUpload}
        organizationId="org-1"
        companyProfileId="profile-1"
        maxSize={1}
      />
    );

    const input = getFileInput(container);
    const bigZip = new File(
      [new Uint8Array(2 * 1024 * 1024)],
      "repo.zip",
      { type: "application/zip" }
    );
    fireEvent.change(input, { target: { files: [bigZip] } });
    expect(await screen.findByText(/File size exceeds 1MB limit/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uploads valid zip files and surfaces success state", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockResolvedValueOnce(undefined);

    const { container } = renderWithProviders(
      <RepoUploadZone
        onUpload={onUpload}
        organizationId="org-1"
        companyProfileId="profile-1"
      />
    );

    const repoNameInput = screen.getByPlaceholderText(/Repository name/i);
    await user.type(repoNameInput, "core-compliance");

    const input = getFileInput(container);
    const validZip = new File(["zip-content"], "repo-one.zip", {
      type: "application/zip",
    });
    fireEvent.change(input, { target: { files: [validZip] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(
        validZip,
        expect.objectContaining({
          organizationId: "org-1",
          companyProfileId: "profile-1",
          name: "core-compliance",
        })
      );
    });
    expect(await screen.findByText(/Upload Successful!/i)).toBeInTheDocument();
  });

  it("surfaces upload failure state from upload callback errors", async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error("network timeout"));
    const { container } = renderWithProviders(
      <RepoUploadZone
        onUpload={onUpload}
        organizationId="org-1"
        companyProfileId="profile-1"
      />
    );

    const input = getFileInput(container);
    const zip = new File(["zip-content"], "repo-two.zip", {
      type: "application/zip",
    });
    fireEvent.change(input, { target: { files: [zip] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(
        zip,
        expect.objectContaining({
          name: "repo-two",
        })
      );
    });
    expect(await screen.findByText(/Upload Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
  });
});
