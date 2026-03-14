import type { Meta, StoryObj } from '@storybook/react';
import NotificationDropdown from '../../components/notifications/NotificationDropdown';

const meta = {
  title: 'App/notifications/NotificationDropdown',
  component: NotificationDropdown,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationDropdown>;

export default meta;
type Story = StoryObj<typeof NotificationDropdown>;

export const Default: Story = {
  args: {} as any,
};
