import type { Meta, StoryObj } from '@storybook/react';
import { CloudIntegrationList } from '../../components/admin/CloudIntegrationList';

const meta = {
  title: 'App/admin/CloudIntegrationList',
  component: CloudIntegrationList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CloudIntegrationList>;

export default meta;
type Story = StoryObj<typeof CloudIntegrationList>;

export const Default: Story = {
  args: {} as any,
};
