import type { Meta, StoryObj } from '@storybook/react';
import { OfflineIndicator } from '../../components/layout/offline-indicator';

const meta = {
  title: 'App/layout/OfflineIndicator',
  component: OfflineIndicator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OfflineIndicator>;

export default meta;
type Story = StoryObj<typeof OfflineIndicator>;

export const Default: Story = {
  args: {} as any,
};
