import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../../components/ui/tooltip';

const meta = {
  title: 'App/ui/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {} as any,
};
