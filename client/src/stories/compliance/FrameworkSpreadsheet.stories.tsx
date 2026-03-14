import type { Meta, StoryObj } from '@storybook/react';
import { FrameworkSpreadsheet } from '../../components/compliance/FrameworkSpreadsheet';

const meta = {
  title: 'App/compliance/FrameworkSpreadsheet',
  component: FrameworkSpreadsheet,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FrameworkSpreadsheet>;

export default meta;
type Story = StoryObj<typeof FrameworkSpreadsheet>;

export const Default: Story = {
  args: {} as any,
};
