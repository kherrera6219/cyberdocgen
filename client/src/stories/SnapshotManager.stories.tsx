import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnapshotManager } from "@/components/evidence/SnapshotManager";

// Create a client for the story
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Seed mock data
queryClient.setQueryData(["/api/evidence/snapshots"], {
  data: [
    {
      id: "snap-1",
      name: "Q1 2024 Audit Prep",
      status: "open",
      createdAt: new Date().toISOString(),
    },
    {
      id: "snap-2",
      name: "SOC2 Type II 2023",
      status: "locked",
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
});

const meta: Meta<typeof SnapshotManager> = {
  title: "Evidence/SnapshotManager",
  component: SnapshotManager,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="p-4 max-w-2xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SnapshotManager>;

export const Default: Story = {
  args: {
    selectedSnapshotId: null,
    onSnapshotSelect: (id, name) => console.log("Selected:", id, name),
  },
};

export const Selected: Story = {
  args: {
    selectedSnapshotId: "snap-1",
    onSnapshotSelect: (id, name) => console.log("Selected:", id, name),
  },
};

export const Locked: Story = {
  args: {
    selectedSnapshotId: "snap-2",
    onSnapshotSelect: (id, name) => console.log("Selected:", id, name),
  },
};
