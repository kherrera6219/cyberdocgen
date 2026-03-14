import type { Meta, StoryObj } from '@storybook/react';
import { StorageStatsView } from '../../components/storage/StorageStatsView';

const meta = {
  title: 'App/storage/StorageStatsView',
  component: StorageStatsView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StorageStatsView>;

export default meta;
type Story = StoryObj<typeof StorageStatsView>;

export const Default: Story = {
  args: {} as any,
};
