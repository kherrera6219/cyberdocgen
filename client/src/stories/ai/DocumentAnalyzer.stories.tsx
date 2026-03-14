import type { Meta, StoryObj } from '@storybook/react';
import { DocumentAnalyzer } from '../../components/ai/DocumentAnalyzer';

const meta = {
  title: 'App/ai/DocumentAnalyzer',
  component: DocumentAnalyzer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentAnalyzer>;

export default meta;
type Story = StoryObj<typeof DocumentAnalyzer>;

export const Default: Story = {
  args: {} as any,
};
