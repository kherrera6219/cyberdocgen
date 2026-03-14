import type { Meta, StoryObj } from '@storybook/react';
import { ControlPrioritizer } from '../../components/ai/ControlPrioritizer';

const meta = {
  title: 'App/ai/ControlPrioritizer',
  component: ControlPrioritizer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ControlPrioritizer>;

export default meta;
type Story = StoryObj<typeof ControlPrioritizer>;

export const Default: Story = {
  args: {} as any,
};
