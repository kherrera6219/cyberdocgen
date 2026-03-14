import type { Meta, StoryObj } from '@storybook/react';
import { AppErrorHandler } from '../components/AppErrorHandler';

const meta = {
  title: 'App/Uncategorized/AppErrorHandler',
  component: AppErrorHandler,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AppErrorHandler>;

export default meta;
type Story = StoryObj<typeof AppErrorHandler>;

export const Default: Story = {
  args: {} as any,
};
