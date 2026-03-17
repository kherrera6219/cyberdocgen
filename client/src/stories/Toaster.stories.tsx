import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { ToastAction } from '../components/ui/toast';

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toaster>;

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
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2024 at 5:57 PM",
          });
        }}
      >
        Show Default Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }}
      >
        Show Destructive Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Document Generated",
            description: "Your System Security Plan is ready to download.",
            action: <ToastAction altText="Download">Download PDF</ToastAction>,
          });
        }}
      >
        Show Action Toast
      </Button>
      <Toaster />
    </div>
  );
};

export const Default: StoryObj = {
  render: () => <ToastDemo />,
};
