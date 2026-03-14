import type { Meta, StoryObj } from '@storybook/react';
import { ControlsTab } from '../../components/company-profile/ControlsTab';

const meta = {
  title: 'App/company-profile/ControlsTab',
  component: ControlsTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ControlsTab>;

export default meta;
type Story = StoryObj<typeof ControlsTab>;

export const Default: Story = {
  args: {} as any,
};
