import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '../../components/ui/progress';

const meta = {
  title: 'App/ui/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {} as any,
};
