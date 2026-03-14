import type { Meta, StoryObj } from '@storybook/react';
import { Motion } from '../../components/ui/Motion';

const meta = {
  title: 'App/ui/Motion',
  component: Motion,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Motion>;

export default meta;
type Story = StoryObj<typeof Motion>;

export const Default: Story = {
  args: {} as any,
};
