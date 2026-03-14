import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from '../../components/ui/toaster';

const meta = {
  title: 'App/ui/Toaster',
  component: Toaster,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  args: {} as any,
};
