import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, X, Lightbulb, Target, Zap } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  action?: string;
  actionUrl?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to ComplianceAI",
    description: "Your AI-powered compliance documentation platform. Let's get you started with a quick tour of the key features.",
    icon: <Lightbulb className="h-6 w-6 text-blue-500" />
  },
  {
    id: "profile",
    title: "Set Up Your Company Profile",
    description: "Configure your organization's details, industry, and technical environment. This information helps AI generate accurate, tailored compliance documents.",
    icon: <Target className="h-6 w-6 text-green-500" />,
    action: "Set Up Profile",
    actionUrl: "/enhanced-profile"
  },
  {
    id: "generate",
    title: "Generate Compliance Documents",
    description: "Use AI to automatically generate comprehensive compliance documentation for ISO 27001, SOC 2, FedRAMP, and NIST frameworks.",
    icon: <Zap className="h-6 w-6 text-purple-500" />,
    action: "Start Generating",
    actionUrl: "/dashboard"
  },
  {
    id: "workspace",
    title: "Manage Your Documents",
    description: "Review, edit, collaborate, and track progress on all your compliance documents in the centralized workspace.",
    icon: <CheckCircle className="h-6 w-6 text-orange-500" />,
    action: "Open Workspace",
    actionUrl: "/workspace"
  }
];

interface WelcomeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function WelcomeTutorial({ isOpen, onClose, onComplete }: WelcomeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleActionClick = (actionUrl?: string) => {
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    onComplete();
    onClose();
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentStepData = tutorialSteps[currentStep];

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Welcome aboard!</DialogTitle>
            <DialogDescription>
              You're all set to start automating your compliance documentation with AI.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Step {currentStep + 1} of {tutorialSteps.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              {currentStepData.icon}
            </div>
            <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              </div>

              <div className="flex space-x-2">
                {currentStepData.action && currentStepData.actionUrl && (
                  <Button
                    onClick={() => handleActionClick(currentStepData.actionUrl)}
                    className="flex items-center space-x-2"
                  >
                    <span>{currentStepData.action}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>{currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}