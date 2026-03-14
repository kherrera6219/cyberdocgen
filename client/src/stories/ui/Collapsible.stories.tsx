import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible } from '../../components/ui/collapsible';

const meta = {
  title: 'App/ui/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  args: {} as any,
};
