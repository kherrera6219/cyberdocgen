import type { Meta, StoryObj } from '@storybook/react';
import { AnalysisProgress } from '../../components/repository/AnalysisProgress';

const meta = {
  title: 'App/repository/AnalysisProgress',
  component: AnalysisProgress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnalysisProgress>;

export default meta;
type Story = StoryObj<typeof AnalysisProgress>;

export const Default: Story = {
  args: {} as any,
};
