import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../../components/ui/switch';

const meta = {
  title: 'App/ui/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {} as any,
};
