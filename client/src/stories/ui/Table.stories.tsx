import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../../components/ui/table';

const meta = {
  title: 'App/ui/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {} as any,
};
