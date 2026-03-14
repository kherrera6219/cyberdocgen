import type { Meta, StoryObj } from '@storybook/react';
import { PersonnelTab } from '../../components/company-profile/PersonnelTab';

const meta = {
  title: 'App/company-profile/PersonnelTab',
  component: PersonnelTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PersonnelTab>;

export default meta;
type Story = StoryObj<typeof PersonnelTab>;

export const Default: Story = {
  args: {} as any,
};
