import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from '../../components/ui/breadcrumb';

const meta = {
  title: 'App/ui/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {} as any,
};
