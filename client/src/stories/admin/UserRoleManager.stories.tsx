import type { Meta, StoryObj } from '@storybook/react';
import { UserRoleManager } from '../../components/admin/UserRoleManager';

const meta = {
  title: 'App/admin/UserRoleManager',
  component: UserRoleManager,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UserRoleManager>;

export default meta;
type Story = StoryObj<typeof UserRoleManager>;

export const Default: Story = {
  args: {} as any,
};
