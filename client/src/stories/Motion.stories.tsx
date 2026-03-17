import type { Meta, StoryObj } from '@storybook/react';
import { Motion, MotionList } from '../components/ui/Motion';

const meta = {
  title: 'UI/Motion',
  component: Motion,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['fadeIn', 'slideUp', 'scaleIn'],
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Motion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FadeIn: Story = {
  args: {
    variant: 'fadeIn',
    children: (
      <div className="p-6 bg-primary text-primary-foreground rounded-lg shadow-md">
        I fade in smoothly!
      </div>
    ),
  },
};

export const SlideUp: Story = {
  args: {
    variant: 'slideUp',
    children: (
      <div className="p-6 bg-secondary text-secondary-foreground rounded-lg shadow-md">
        I slide up from below!
      </div>
    ),
  },
};

export const ScaleIn: Story = {
  args: {
    variant: 'scaleIn',
    children: (
      <div className="p-6 bg-accent text-accent-foreground rounded-lg shadow-md">
        I scale in from a smaller size!
      </div>
    ),
  },
};

export const MotionListExample: StoryObj<typeof MotionList> = {
  render: () => (
    <MotionList className="space-y-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <Motion key={item} variant="slideUp">
          <div className="p-4 bg-card border rounded-md shadow-sm">
            List Item {item}
          </div>
        </Motion>
      ))}
    </MotionList>
  ),
};
