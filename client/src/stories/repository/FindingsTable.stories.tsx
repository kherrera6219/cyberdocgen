import type { Meta, StoryObj } from '@storybook/react';
import { FindingsTable } from '../../components/repository/FindingsTable';

const meta = {
  title: 'App/repository/FindingsTable',
  component: FindingsTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FindingsTable>;

export default meta;
type Story = StoryObj<typeof FindingsTable>;

export const Default: Story = {
  args: {} as any,
};
