import type { Meta, StoryObj } from '@storybook/react';
import { RecentDocuments } from '../../components/dashboard/RecentDocuments';

const meta = {
  title: 'App/dashboard/RecentDocuments',
  component: RecentDocuments,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecentDocuments>;

export default meta;
type Story = StoryObj<typeof RecentDocuments>;

export const Default: Story = {
  args: {} as any,
};
