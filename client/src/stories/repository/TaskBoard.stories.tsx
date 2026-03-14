import type { Meta, StoryObj } from '@storybook/react';
import { TaskBoard } from '../../components/repository/TaskBoard';

const meta = {
  title: 'App/repository/TaskBoard',
  component: TaskBoard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TaskBoard>;

export default meta;
type Story = StoryObj<typeof TaskBoard>;

export const Default: Story = {
  args: {} as any,
};
