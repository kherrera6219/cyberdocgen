import type { Meta, StoryObj } from '@storybook/react';
import { NetworkBanner } from '../components/NetworkBanner';

const meta = {
  title: 'App/Uncategorized/NetworkBanner',
  component: NetworkBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkBanner>;

export default meta;
type Story = StoryObj<typeof NetworkBanner>;

export const Default: Story = {
  args: {} as any,
};
