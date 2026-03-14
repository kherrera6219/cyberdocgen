import type { Meta, StoryObj } from '@storybook/react';
import { PDFSecuritySettings } from '../../components/admin/PDFSecuritySettings';

const meta = {
  title: 'App/admin/PDFSecuritySettings',
  component: PDFSecuritySettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PDFSecuritySettings>;

export default meta;
type Story = StoryObj<typeof PDFSecuritySettings>;

export const Default: Story = {
  args: {} as any,
};
