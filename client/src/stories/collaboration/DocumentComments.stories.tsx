import type { Meta, StoryObj } from '@storybook/react';
import { DocumentComments } from '../../components/collaboration/DocumentComments';

const meta = {
  title: 'App/collaboration/DocumentComments',
  component: DocumentComments,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentComments>;

export default meta;
type Story = StoryObj<typeof DocumentComments>;

export const Default: Story = {
  args: {} as any,
};
