import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../../components/ui/tabs';

const meta = {
  title: 'App/ui/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {} as any,
};
