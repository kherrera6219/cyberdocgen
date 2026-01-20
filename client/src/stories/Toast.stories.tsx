import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';

const MetaWrapper = () => {
  return null;
}

const meta = {
  title: 'UI/Toast',
  component: MetaWrapper,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof MetaWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up ',
            description: 'Friday, February 10, 2023 at 5:57 PM',
          });
        }}
      >
        Show Toast
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
          });
        }}
      >
        Show Destructive Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
            action: (
              <div 
                // Using a div here to avoid TypeScript issues with the ToastAction type in this context,
                // but normally you'd use ToastAction exposed from the component
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
                onClick={() => console.log('Undo')}
              >
                Try again
              </div>
            ),
          })
        }}
      >
        Show Toast with Action
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: () => <ToastDemo />,
};
