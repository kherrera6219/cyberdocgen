import type { Meta, StoryObj } from '@storybook/react';
import { DocumentTemplates } from '../../components/templates/DocumentTemplates';

const meta = {
  title: 'App/templates/DocumentTemplates',
  component: DocumentTemplates,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentTemplates>;

export default meta;
type Story = StoryObj<typeof DocumentTemplates>;

export const Default: Story = {
  args: {} as any,
};
