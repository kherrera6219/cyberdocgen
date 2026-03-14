import type { Meta, StoryObj } from '@storybook/react';
import { FileListView } from '../../components/storage/FileListView';

const meta = {
  title: 'App/storage/FileListView',
  component: FileListView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileListView>;

export default meta;
type Story = StoryObj<typeof FileListView>;

export const Default: Story = {
  args: {} as any,
};
