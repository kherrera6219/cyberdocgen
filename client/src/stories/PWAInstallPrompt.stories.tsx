import type { Meta, StoryObj } from '@storybook/react';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

const meta = {
  title: 'App/Uncategorized/PWAInstallPrompt',
  component: PWAInstallPrompt,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PWAInstallPrompt>;

export default meta;
type Story = StoryObj<typeof PWAInstallPrompt>;

export const Default: Story = {
  args: {} as any,
};
