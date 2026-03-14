import type { Meta, StoryObj } from '@storybook/react';
import { QuickStats } from '../../components/dashboard/QuickStats';

const meta = {
  title: 'App/dashboard/QuickStats',
  component: QuickStats,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuickStats>;

export default meta;
type Story = StoryObj<typeof QuickStats>;

export const Default: Story = {
  args: {} as any,
};
