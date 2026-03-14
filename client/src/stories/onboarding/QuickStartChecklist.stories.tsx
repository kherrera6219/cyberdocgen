import type { Meta, StoryObj } from '@storybook/react';
import { QuickStartChecklist } from '../../components/onboarding/QuickStartChecklist';

const meta = {
  title: 'App/onboarding/QuickStartChecklist',
  component: QuickStartChecklist,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuickStartChecklist>;

export default meta;
type Story = StoryObj<typeof QuickStartChecklist>;

export const Default: Story = {
  args: {} as any,
};
