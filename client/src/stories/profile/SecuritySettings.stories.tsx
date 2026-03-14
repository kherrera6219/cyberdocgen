import type { Meta, StoryObj } from '@storybook/react';
import { SecuritySettings } from '../../components/profile/SecuritySettings';

const meta = {
  title: 'App/profile/SecuritySettings',
  component: SecuritySettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SecuritySettings>;

export default meta;
type Story = StoryObj<typeof SecuritySettings>;

export const Default: Story = {
  args: {} as any,
};
