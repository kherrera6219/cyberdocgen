import type { Meta, StoryObj } from '@storybook/react';
import { RiskAssessment } from '../../components/ai/RiskAssessment';

const meta = {
  title: 'App/ai/RiskAssessment',
  component: RiskAssessment,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RiskAssessment>;

export default meta;
type Story = StoryObj<typeof RiskAssessment>;

export const Default: Story = {
  args: {} as any,
};
