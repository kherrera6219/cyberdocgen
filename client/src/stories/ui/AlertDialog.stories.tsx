import type { Meta, StoryObj } from '@storybook/react';
import { AlertDialog } from '../../components/ui/alert-dialog';

const meta = {
  title: 'App/ui/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
  args: {} as any,
};
