import type { Meta, StoryObj } from '@storybook/react';
import { NotificationSettingsForm } from '../../components/profile/NotificationSettingsForm';

const meta = {
  title: 'App/profile/NotificationSettingsForm',
  component: NotificationSettingsForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationSettingsForm>;

export default meta;
type Story = StoryObj<typeof NotificationSettingsForm>;

export const Default: Story = {
  args: {} as any,
};
