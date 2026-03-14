import type { Meta, StoryObj } from '@storybook/react';
import { ComplianceInsights } from '../../components/ai/ComplianceInsights';

const meta = {
  title: 'App/ai/ComplianceInsights',
  component: ComplianceInsights,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComplianceInsights>;

export default meta;
type Story = StoryObj<typeof ComplianceInsights>;

export const Default: Story = {
  args: {} as any,
};
