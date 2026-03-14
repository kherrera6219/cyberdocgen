import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedAnalytics } from '../../components/ai/EnhancedAnalytics';

const meta = {
  title: 'App/ai/EnhancedAnalytics',
  component: EnhancedAnalytics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EnhancedAnalytics>;

export default meta;
type Story = StoryObj<typeof EnhancedAnalytics>;

export const Default: Story = {
  args: {} as any,
};
