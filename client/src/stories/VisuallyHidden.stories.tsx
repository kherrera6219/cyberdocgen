import type { Meta, StoryObj } from '@storybook/react';
import { VisuallyHidden } from '../components/ui/visually-hidden';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This text is visually hidden but available to screen readers.',
  },
  render: (args) => (
    <div className="p-4 border rounded-md">
      <p>The text below is hidden visually, but will be read by screen readers:</p>
      <div className="mt-4 p-2 bg-muted rounded-md border-dashed border-2">
        <VisuallyHidden {...args} />
        <span className="text-muted-foreground text-sm">
          (Hidden element is here - inspect the DOM to see it)
        </span>
      </div>
    </div>
  ),
};

export const IconWithHiddenLabel: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A common use case is providing accessible names for icon-only buttons.
      </p>
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
          <VisuallyHidden>Search site</VisuallyHidden>
        </Button>
      </div>
    </div>
  ),
};
