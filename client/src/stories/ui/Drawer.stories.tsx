import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from '../../components/ui/drawer';

const meta = {
  title: 'App/ui/Drawer',
  component: Drawer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  args: {} as any,
};
