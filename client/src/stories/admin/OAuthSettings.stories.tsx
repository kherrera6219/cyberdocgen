import type { Meta, StoryObj } from '@storybook/react';
import { OAuthSettings } from '../../components/admin/OAuthSettings';

const meta = {
  title: 'App/admin/OAuthSettings',
  component: OAuthSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OAuthSettings>;

export default meta;
type Story = StoryObj<typeof OAuthSettings>;

export const Default: Story = {
  args: {} as any,
};
