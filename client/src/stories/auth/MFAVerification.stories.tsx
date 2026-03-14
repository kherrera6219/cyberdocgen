import type { Meta, StoryObj } from '@storybook/react';
import { MFAVerification } from '../../components/auth/MFAVerification';

const meta = {
  title: 'App/auth/MFAVerification',
  component: MFAVerification,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MFAVerification>;

export default meta;
type Story = StoryObj<typeof MFAVerification>;

export const Default: Story = {
  args: {} as any,
};
