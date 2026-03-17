import type { Meta, StoryObj } from '@storybook/react';
import { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent, 
  EnhancedCardFooter 
} from '../components/ui/enhanced-card';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/EnhancedCard',
  component: EnhancedCard,
  tags: ['autodocs'],
  argTypes: {
    gradient: { control: 'boolean' },
    hover: { control: 'boolean' },
    border: {
      control: 'select',
      options: ['left', 'top', 'right', 'bottom', 'none'],
    },
    borderColor: { control: 'text' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EnhancedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    gradient: false,
    hover: true,
    border: 'none',
    className: 'w-[350px]',
    children: (
      <>
        <EnhancedCardHeader>
          <EnhancedCardTitle>Framework Selected</EnhancedCardTitle>
          <EnhancedCardDescription>NIST 800-53 Rev 5.</EnhancedCardDescription>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <p className="text-sm">Compliance documentation will be generated according to this framework.</p>
        </EnhancedCardContent>
        <EnhancedCardFooter>
          <Button variant="outline" className="w-full">Edit Selection</Button>
        </EnhancedCardFooter>
      </>
    ),
  },
};

export const WithGradient: Story = {
  args: {
    ...Default.args,
    gradient: true,
  },
};

export const WithLeftBorder: Story = {
  args: {
    ...Default.args,
    border: 'left',
    borderColor: 'border-l-primary',
  },
};

export const WithTopBorder: Story = {
  args: {
    ...Default.args,
    border: 'top',
    borderColor: 'border-t-destructive',
  },
};

export const NoHoverEffect: Story = {
  args: {
    ...Default.args,
    hover: false,
  },
};
