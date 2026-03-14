import type { Meta, StoryObj } from '@storybook/react';
import { ObjectStorageManager } from '../components/ObjectStorageManager';

const meta = {
  title: 'App/Uncategorized/ObjectStorageManager',
  component: ObjectStorageManager,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ObjectStorageManager>;

export default meta;
type Story = StoryObj<typeof ObjectStorageManager>;

export const Default: Story = {
  args: {} as any,
};
