import type { Meta, StoryObj } from '@storybook/react';
import { BasicInfoTab } from '../../components/company-profile/BasicInfoTab';

const meta = {
  title: 'App/company-profile/BasicInfoTab',
  component: BasicInfoTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BasicInfoTab>;

export default meta;
type Story = StoryObj<typeof BasicInfoTab>;

export const Default: Story = {
  args: {} as any,
};
