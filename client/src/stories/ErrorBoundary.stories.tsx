import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const meta = {
  title: 'App/Uncategorized/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {
  args: {} as any,
};
