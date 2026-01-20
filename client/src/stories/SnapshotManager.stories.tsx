import type { Meta, StoryObj } from '@storybook/react';
import { SnapshotManager } from '../components/evidence/SnapshotManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const meta: Meta<typeof SnapshotManager> = {
  title: 'Evidence/SnapshotManager',
  component: SnapshotManager,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SnapshotManager>;

export const Default: Story = {
  args: {
    selectedSnapshotId: null,
    onSnapshotSelect: (id) => console.log('Selected:', id),
  },
};

export const Selected: Story = {
  args: {
    selectedSnapshotId: 'mock-snapshot-1',
    onSnapshotSelect: (id) => console.log('Selected:', id),
  },
};
