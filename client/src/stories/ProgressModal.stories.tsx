import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressModal } from '../components/ui/progress-modal';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/ProgressModal',
  component: ProgressModal,
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to manage open state in Storybook
const ProgressModalDemo = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Progress Modal</Button>
      <ProgressModal 
        {...args} 
        isOpen={isOpen || args.isOpen} 
        onOpenChange={(open) => {
          if (!args.isOpen) setIsOpen(open);
        }} 
      />
    </div>
  );
};

export const Starting: Story = {
  render: (args) => <ProgressModalDemo {...args} />,
  args: {
    isOpen: true,
    progress: 5,
    currentStep: 'Initializing engine...',
    framework: 'SOC 2 Type II',
  },
};

export const InProgress: Story = {
  render: (args) => <ProgressModalDemo {...args} />,
  args: {
    isOpen: true,
    progress: 45,
    currentStep: 'Analyzing access control policies...',
    framework: 'ISO 27001',
  },
};

export const AlmostDone: Story = {
  render: (args) => <ProgressModalDemo {...args} />,
  args: {
    isOpen: true,
    progress: 85,
    currentStep: 'Compiling final PDF...',
    framework: 'GDPR Readiness',
  },
};

export const Completed: Story = {
  render: (args) => <ProgressModalDemo {...args} />,
  args: {
    isOpen: true,
    progress: 100,
    currentStep: 'Done',
    framework: 'HIPAA',
  },
};

// Animated demo showing progress over time
const AnimatedProgressModalDemo = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  let currentStep = 'Initializing engine...';
  if (progress > 10) currentStep = 'Analyzing company profile...';
  if (progress > 50) currentStep = 'Generating compliance documents...';
  if (progress >= 100) currentStep = 'Preparing exports...';

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Start Animated Demo</Button>
      <ProgressModal 
        {...args} 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        progress={progress}
        currentStep={currentStep}
      />
    </div>
  );
};

export const Animated: Story = {
  render: (args) => <AnimatedProgressModalDemo {...args} />,
  args: {
    framework: 'Demo Framework',
  },
};
