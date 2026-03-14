import type { Meta, StoryObj } from '@storybook/react';
import { FedRampTab } from '../../components/company-profile/FedRampTab';

const meta = {
  title: 'App/company-profile/FedRampTab',
  component: FedRampTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FedRampTab>;

export default meta;
type Story = StoryObj<typeof FedRampTab>;

export const Default: Story = {
  args: {} as any,
};
