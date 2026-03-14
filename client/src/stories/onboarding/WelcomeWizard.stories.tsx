import type { Meta, StoryObj } from '@storybook/react';
import { WelcomeWizard } from '../../components/onboarding/welcome-wizard';

const meta = {
  title: 'App/onboarding/WelcomeWizard',
  component: WelcomeWizard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WelcomeWizard>;

export default meta;
type Story = StoryObj<typeof WelcomeWizard>;

export const Default: Story = {
  args: {} as any,
};
