import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSkeleton } from '../../components/loading/loading-skeleton';

const meta = {
  title: 'App/loading/LoadingSkeleton',
  component: LoadingSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof LoadingSkeleton>;

export const Default: Story = {
  args: {} as any,
};
