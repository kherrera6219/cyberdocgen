import type { Meta, StoryObj } from '@storybook/react';
import { CompanyProfileSummary } from '../../components/dashboard/CompanyProfileSummary';

const meta = {
  title: 'App/dashboard/CompanyProfileSummary',
  component: CompanyProfileSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompanyProfileSummary>;

export default meta;
type Story = StoryObj<typeof CompanyProfileSummary>;

export const Default: Story = {
  args: {} as any,
};
