import type { Meta, StoryObj } from '@storybook/react';
import GoogleAuthenticatorSetup from '../../components/auth/GoogleAuthenticatorSetup';

const meta = {
  title: 'App/auth/GoogleAuthenticatorSetup',
  component: GoogleAuthenticatorSetup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GoogleAuthenticatorSetup>;

export default meta;
type Story = StoryObj<typeof GoogleAuthenticatorSetup>;

export const Default: Story = {
  args: {} as any,
};
