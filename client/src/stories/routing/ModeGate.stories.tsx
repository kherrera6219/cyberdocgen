import type { Meta, StoryObj } from '@storybook/react';
import { ModeGate } from '../../components/routing/ModeGate';

const meta = {
  title: 'App/routing/ModeGate',
  component: ModeGate,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModeGate>;

export default meta;
type Story = StoryObj<typeof ModeGate>;

export const Default: Story = {
  args: {} as any,
};
