import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from '../../components/ui/popover';

const meta = {
  title: 'App/ui/Popover',
  component: Popover,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  args: {} as any,
};
