import type { Meta, StoryObj } from '@storybook/react';
import { AIInsightsDashboard } from '../../components/ai/AIInsightsDashboard';

const meta = {
  title: 'App/ai/AIInsightsDashboard',
  component: AIInsightsDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AIInsightsDashboard>;

export default meta;
type Story = StoryObj<typeof AIInsightsDashboard>;

export const Default: Story = {
  args: {} as any,
};
