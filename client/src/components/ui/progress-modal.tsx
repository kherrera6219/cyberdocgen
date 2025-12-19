import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Wand2, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  progress: number;
  currentStep: string;
  framework: string;
}

export function ProgressModal({ 
  isOpen, 
  onOpenChange, 
  progress, 
  currentStep, 
  framework 
}: ProgressModalProps) {
  const steps = [
    { label: "Analyzing company profile", icon: CheckCircle, completed: progress > 10 },
    { label: "Generating compliance documents", icon: Wand2, completed: progress > 50 },
    { label: "Preparing exports", icon: FileText, completed: progress >= 100 },
  ];

  const estimatedTime = Math.max(1, Math.round((100 - progress) / 10));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generating {framework} Documents</DialogTitle>
          <DialogDescription>
            AI is generating your compliance documentation. This may take a few minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step.completed
                  ? "bg-accent text-white"
                  : index === 1 && progress > 10 && progress < 100
                  ? "bg-primary text-white animate-pulse"
                  : "bg-gray-200 text-gray-400"
              )}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-sm",
                step.completed ? "text-gray-700" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Progress value={progress} className="w-full" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">
              {progress}% complete
            </p>
            {progress < 100 && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {estimatedTime} min remaining
              </div>
            )}
          </div>
        </div>

        {currentStep && progress < 100 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-primary font-medium">Current: {currentStep}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}