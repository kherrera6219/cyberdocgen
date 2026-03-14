import type { Meta, StoryObj } from '@storybook/react';
import { TemporaryLoginDialog } from '../components/TemporaryLoginDialog';

const meta = {
  title: 'App/Uncategorized/TemporaryLoginDialog',
  component: TemporaryLoginDialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TemporaryLoginDialog>;

export default meta;
type Story = StoryObj<typeof TemporaryLoginDialog>;

export const Default: Story = {
  args: {} as any,
};
