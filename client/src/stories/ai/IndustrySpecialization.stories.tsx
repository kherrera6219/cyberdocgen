import type { Meta, StoryObj } from '@storybook/react';
import { IndustrySpecialization } from '../../components/ai/IndustrySpecialization';

const meta = {
  title: 'App/ai/IndustrySpecialization',
  component: IndustrySpecialization,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IndustrySpecialization>;

export default meta;
type Story = StoryObj<typeof IndustrySpecialization>;

export const Default: Story = {
  args: {} as any,
};
