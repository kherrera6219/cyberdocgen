import type { Meta, StoryObj } from '@storybook/react';
import { RepoUploadZone } from '../../components/repository/RepoUploadZone';

const meta = {
  title: 'App/repository/RepoUploadZone',
  component: RepoUploadZone,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RepoUploadZone>;

export default meta;
type Story = StoryObj<typeof RepoUploadZone>;

export const Default: Story = {
  args: {} as any,
};
