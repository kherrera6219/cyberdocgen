import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from '../../components/ui/dropdown-menu';

const meta = {
  title: 'App/ui/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  args: {} as any,
};
