import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from '../../components/ui/context-menu';

const meta = {
  title: 'App/ui/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  args: {} as any,
};
