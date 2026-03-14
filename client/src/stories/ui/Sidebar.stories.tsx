import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from '../../components/ui/sidebar';

const meta = {
  title: 'App/ui/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {} as any,
};
