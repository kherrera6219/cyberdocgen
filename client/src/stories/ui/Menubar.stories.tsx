import type { Meta, StoryObj } from '@storybook/react';
import { Menubar } from '../../components/ui/menubar';

const meta = {
  title: 'App/ui/Menubar',
  component: Menubar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  args: {} as any,
};
