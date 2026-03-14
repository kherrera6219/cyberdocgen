import type { Meta, StoryObj } from '@storybook/react';
import { Resizable } from '../../components/ui/resizable';

const meta = {
  title: 'App/ui/Resizable',
  component: Resizable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof Resizable>;

export const Default: Story = {
  args: {} as any,
};
