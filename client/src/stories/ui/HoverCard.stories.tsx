import type { Meta, StoryObj } from '@storybook/react';
import { HoverCard } from '../../components/ui/hover-card';

const meta = {
  title: 'App/ui/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  args: {} as any,
};
