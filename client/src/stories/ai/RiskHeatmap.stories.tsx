import type { Meta, StoryObj } from '@storybook/react';
import { RiskHeatmap } from '../../components/ai/RiskHeatmap';

const meta = {
  title: 'App/ai/RiskHeatmap',
  component: RiskHeatmap,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RiskHeatmap>;

export default meta;
type Story = StoryObj<typeof RiskHeatmap>;

export const Default: Story = {
  args: {} as any,
};
