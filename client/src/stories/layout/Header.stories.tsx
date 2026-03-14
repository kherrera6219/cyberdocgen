import type { Meta, StoryObj } from '@storybook/react';
import Header from '../../components/layout/header';

const meta = {
  title: 'App/layout/Header',
  component: Header,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {} as any,
};
