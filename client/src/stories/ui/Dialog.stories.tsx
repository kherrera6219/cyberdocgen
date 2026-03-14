import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '../../components/ui/dialog';

const meta = {
  title: 'App/ui/Dialog',
  component: Dialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  args: {} as any,
};
