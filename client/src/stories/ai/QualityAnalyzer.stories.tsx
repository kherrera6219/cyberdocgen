import type { Meta, StoryObj } from '@storybook/react';
import { QualityAnalyzer } from '../../components/ai/QualityAnalyzer';

const meta = {
  title: 'App/ai/QualityAnalyzer',
  component: QualityAnalyzer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QualityAnalyzer>;

export default meta;
type Story = StoryObj<typeof QualityAnalyzer>;

export const Default: Story = {
  args: {} as any,
};
