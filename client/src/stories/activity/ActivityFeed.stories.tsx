import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from '../../components/activity/ActivityFeed';

const meta = {
  title: 'App/activity/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityFeed>;

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

export const Default: Story = {
  args: {} as any,
};
