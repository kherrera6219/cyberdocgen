import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../../components/ui/avatar';

const meta = {
  title: 'App/ui/Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {} as any,
};
