import type { Meta, StoryObj } from '@storybook/react';
import { RepositoryList } from '../../components/repository/RepositoryList';

const meta = {
  title: 'App/repository/RepositoryList',
  component: RepositoryList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RepositoryList>;

export default meta;
type Story = StoryObj<typeof RepositoryList>;

export const Default: Story = {
  args: {} as any,
};
