import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from '../../components/ui/pagination';

const meta = {
  title: 'App/ui/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {} as any,
};
