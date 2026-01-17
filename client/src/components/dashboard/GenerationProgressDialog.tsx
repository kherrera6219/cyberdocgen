import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface GenerationProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentFramework: string;
  progress: number;
  onCancel: () => void;
}

export function GenerationProgressDialog({ 
  isOpen, 
  onOpenChange, 
  currentFramework, 
  progress, 
  onCancel 
}: GenerationProgressDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Generating {currentFramework} Documents</span>
          </DialogTitle>
          <DialogDescription>
            AI is generating customized compliance documents based on your company profile. This process typically takes 10-15 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              Tip: You can continue using other features while generation is in progress.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            data-testid="button-cancel-generation"
          >
            Cancel Generation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
