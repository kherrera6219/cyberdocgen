import type { Meta, StoryObj } from '@storybook/react';
import { FileListItem } from '../../components/upload/FileListItem';

const meta = {
  title: 'App/upload/FileListItem',
  component: FileListItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileListItem>;

export default meta;
type Story = StoryObj<typeof FileListItem>;

export const Default: Story = {
  args: {} as any,
};
