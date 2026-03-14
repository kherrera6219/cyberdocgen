import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from '../../components/ui/toggle';

const meta = {
  title: 'App/ui/Toggle',
  component: Toggle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {} as any,
};
