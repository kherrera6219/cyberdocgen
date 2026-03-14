import type { Meta, StoryObj } from '@storybook/react';
import { SnapshotManager } from '../../components/evidence/SnapshotManager';

const meta = {
  title: 'App/evidence/SnapshotManager',
  component: SnapshotManager,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SnapshotManager>;

export default meta;
type Story = StoryObj<typeof SnapshotManager>;

export const Default: Story = {
  args: {} as any,
};
