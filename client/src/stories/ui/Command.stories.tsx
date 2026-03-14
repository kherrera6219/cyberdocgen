import type { Meta, StoryObj } from '@storybook/react';
import { Command } from '../../components/ui/command';

const meta = {
  title: 'App/ui/Command',
  component: Command,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  args: {} as any,
};
