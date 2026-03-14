import type { Meta, StoryObj } from '@storybook/react';
import { InputOtp } from '../../components/ui/input-otp';

const meta = {
  title: 'App/ui/InputOtp',
  component: InputOtp,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InputOtp>;

export default meta;
type Story = StoryObj<typeof InputOtp>;

export const Default: Story = {
  args: {} as any,
};
