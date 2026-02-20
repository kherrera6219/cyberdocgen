import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAnalysisStatus,
  useDeleteRepository,
  useFindings,
  useRepositories,
  useRepository,
  useReviewFinding,
  useStartAnalysis,
  useTasks,
  useUpdateTask,
  useUploadRepository,
} from "../../../client/src/hooks/useRepositoryAPI";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("useRepositoryAPI hooks", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("fetches repositories and single repository details", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { snapshots: [{ id: "repo-1", name: "Repo 1" }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { snapshot: { id: "repo-1", name: "Repo 1" } } }));

    const reposCtx = createWrapper();
    const repoList = renderHook(() => useRepositories(), { wrapper: reposCtx.wrapper });
    await waitFor(() => expect(repoList.result.current.isSuccess).toBe(true));
    expect(repoList.result.current.data).toEqual([{ id: "repo-1", name: "Repo 1" }]);

    const repoCtx = createWrapper();
    const repo = renderHook(() => useRepository("repo-1"), { wrapper: repoCtx.wrapper });
    await waitFor(() => expect(repo.result.current.isSuccess).toBe(true));
    expect(repo.result.current.data).toEqual({ id: "repo-1", name: "Repo 1" });

    const disabledCtx = createWrapper();
    renderHook(() => useRepository(""), { wrapper: disabledCtx.wrapper });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/repository",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/repository/repo-1",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uploads a repository and handles upload failures", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { snapshotId: "snap-1" } }));

    const successCtx = createWrapper();
    const upload = renderHook(() => useUploadRepository(), { wrapper: successCtx.wrapper });
    const uploaded = await upload.result.current.mutateAsync({
      file: new File(["zip-content"], "repo.zip"),
      organizationId: "org-1",
      companyProfileId: "profile-1",
      name: "Repo Upload",
    });

    expect(uploaded).toEqual({ snapshotId: "snap-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/repository/upload",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Upload rejected" }, 500));
    const failCtx = createWrapper();
    const uploadFailure = renderHook(() => useUploadRepository(), { wrapper: failCtx.wrapper });
    await expect(
      uploadFailure.result.current.mutateAsync({
        file: new File(["bad"], "bad.zip"),
        organizationId: "org-1",
        companyProfileId: "profile-1",
        name: "Bad Upload",
      }),
    ).rejects.toThrow("Upload rejected");
  });

  it("starts analysis and polls analysis status", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { runId: "analysis-1" } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            analysisRun: {
              phaseStatus: "running",
              phase: "Gap Identification",
              progress: 42,
              filesAnalyzed: 7,
              findingsGenerated: 3,
              llmCallsMade: 2,
              tokensUsed: 1000,
            },
            snapshot: {
              id: "snap-1",
            },
          },
        }),
      );

    const mutationCtx = createWrapper();
    const start = renderHook(() => useStartAnalysis(), { wrapper: mutationCtx.wrapper });
    const payload = await start.result.current.mutateAsync({
      snapshotId: "snap-1",
      frameworks: ["SOC2"],
      depth: "security_relevant",
    });
    expect(payload).toEqual({ runId: "analysis-1" });

    const statusCtx = createWrapper();
    const status = renderHook(() => useAnalysisStatus("snap-1"), { wrapper: statusCtx.wrapper });
    await waitFor(() => expect(status.result.current.isSuccess).toBe(true));
    expect(status.result.current.data?.analysisRun?.phaseStatus).toBe("running");

    const disabledCtx = createWrapper();
    renderHook(() => useAnalysisStatus(""), { wrapper: disabledCtx.wrapper });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/repository/snap-1/analyze",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/repository/snap-1/analysis",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fetches findings/tasks and updates review/task states", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            findings: [{ id: "finding-1" }],
            total: 1,
            summary: {},
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { tasks: [{ id: "task-1" }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { finding: { id: "finding-1", status: "pass" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "task-1", status: "completed" } } }));

    const findingsCtx = createWrapper();
    const findings = renderHook(
      () =>
        useFindings("snap-1", {
          framework: "SOC2",
          status: "fail",
          page: 1,
          limit: 10,
        }),
      { wrapper: findingsCtx.wrapper },
    );
    await waitFor(() => expect(findings.result.current.isSuccess).toBe(true));
    expect(findings.result.current.data?.total).toBe(1);

    const tasksCtx = createWrapper();
    const tasks = renderHook(() => useTasks("snap-1"), { wrapper: tasksCtx.wrapper });
    await waitFor(() => expect(tasks.result.current.isSuccess).toBe(true));
    expect(tasks.result.current.data).toEqual([{ id: "task-1" }]);

    const reviewCtx = createWrapper();
    const review = renderHook(() => useReviewFinding(), { wrapper: reviewCtx.wrapper });
    const reviewed = await review.result.current.mutateAsync({
      snapshotId: "snap-1",
      findingId: "finding-1",
      status: "pass",
      humanOverride: { note: "confirmed" },
    });
    expect(reviewed).toEqual({ id: "finding-1", status: "pass" });

    const updateCtx = createWrapper();
    const updateTask = renderHook(() => useUpdateTask(), { wrapper: updateCtx.wrapper });
    const updated = await updateTask.result.current.mutateAsync({
      snapshotId: "snap-1",
      taskId: "task-1",
      status: "completed",
    });
    expect(updated).toEqual({ id: "task-1", status: "completed" });

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/repository/snap-1/findings?");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/repository/snap-1/tasks");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/repository/snap-1/findings/finding-1");
    expect(fetchMock.mock.calls[3]?.[0]).toBe("/api/repository/snap-1/tasks/task-1");
  });

  it("deletes repositories and throws on failed responses", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 200))
      .mockResolvedValueOnce(jsonResponse({}, 500));

    const successCtx = createWrapper();
    const removeSuccess = renderHook(() => useDeleteRepository(), { wrapper: successCtx.wrapper });
    await expect(removeSuccess.result.current.mutateAsync("snap-1")).resolves.toBe("snap-1");

    const failureCtx = createWrapper();
    const removeFail = renderHook(() => useDeleteRepository(), { wrapper: failureCtx.wrapper });
    await expect(removeFail.result.current.mutateAsync("snap-2")).rejects.toThrow(
      "Failed to delete repository",
    );
  });
});
