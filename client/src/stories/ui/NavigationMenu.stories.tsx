import type { Meta, StoryObj } from '@storybook/react';
import { NavigationMenu } from '../../components/ui/navigation-menu';

const meta = {
  title: 'App/ui/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  args: {} as any,
};
