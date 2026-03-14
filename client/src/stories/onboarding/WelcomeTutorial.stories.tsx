import type { Meta, StoryObj } from '@storybook/react';
import { WelcomeTutorial } from '../../components/onboarding/WelcomeTutorial';

const meta = {
  title: 'App/onboarding/WelcomeTutorial',
  component: WelcomeTutorial,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WelcomeTutorial>;

export default meta;
type Story = StoryObj<typeof WelcomeTutorial>;

export const Default: Story = {
  args: {} as any,
};
