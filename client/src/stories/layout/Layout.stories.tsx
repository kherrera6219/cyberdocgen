import type { Meta, StoryObj } from '@storybook/react';
import Layout from '../../components/layout/index';

const meta = {
  title: 'App/layout/Layout',
  component: Layout,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  args: {} as any,
};
