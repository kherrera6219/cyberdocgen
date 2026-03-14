import type { Meta, StoryObj } from '@storybook/react';
import { FrameworksTab } from '../../components/company-profile/FrameworksTab';

const meta = {
  title: 'App/company-profile/FrameworksTab',
  component: FrameworksTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FrameworksTab>;

export default meta;
type Story = StoryObj<typeof FrameworksTab>;

export const Default: Story = {
  args: {} as any,
};
