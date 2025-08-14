import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, Building, Shield, FileText, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface WelcomeWizardProps {
  onComplete: () => void;
}

export function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const steps = [
    {
      icon: Building,
      title: "Welcome to ComplianceAI",
      description: "Your AI-powered cybersecurity compliance automation platform",
      content: (
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Generate comprehensive compliance documentation for major frameworks including 
            ISO 27001, SOC 2 Type 2, FedRAMP, and NIST CSF.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm">AI-Powered Generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm">Industry Templates</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm">Real-time Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm">Export Ready</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Shield,
      title: "Choose Your Framework",
      description: "Select the compliance framework that matches your needs",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:border-accent transition-colors">
              <h3 className="font-semibold text-accent">ISO 27001</h3>
              <p className="text-sm text-gray-600">Information Security Management System</p>
              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded mt-2 inline-block">14 Documents</span>
            </div>
            <div className="p-4 border rounded-lg hover:border-primary transition-colors">
              <h3 className="font-semibold text-primary">SOC 2 Type 2</h3>
              <p className="text-sm text-gray-600">System & Organization Controls</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">12 Documents</span>
            </div>
            <div className="p-4 border rounded-lg hover:border-purple-500 transition-colors">
              <h3 className="font-semibold text-purple-600">FedRAMP</h3>
              <p className="text-sm text-gray-600">Federal Risk Authorization Management</p>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded mt-2 inline-block">18 Documents</span>
            </div>
            <div className="p-4 border rounded-lg hover:border-orange-500 transition-colors">
              <h3 className="font-semibold text-orange-600">NIST CSF</h3>
              <p className="text-sm text-gray-600">Cybersecurity Framework</p>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded mt-2 inline-block">23 Documents</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: FileText,
      title: "Next Steps",
      description: "Ready to start generating your compliance documents",
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Getting Started</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Complete your company profile with detailed information</li>
              <li>Select your target compliance framework</li>
              <li>Generate documents using our AI engine</li>
              <li>Review, customize, and export your documentation</li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                <Building className="w-6 h-6 text-accent" />
              </div>
              <h5 className="font-medium">Company Profile</h5>
              <p className="text-xs text-gray-600">5 minutes</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h5 className="font-medium">AI Generation</h5>
              <p className="text-xs text-gray-600">10-15 minutes</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-warning" />
              </div>
              <h5 className="font-medium">Export & Review</h5>
              <p className="text-xs text-gray-600">Ready instantly</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      setLocation("/profile");
    }
  };

  const handleSkip = () => {
    onComplete();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <currentStepData.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <p className="text-gray-600">{currentStepData.description}</p>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {currentStepData.content}
          
          <div className="flex justify-between items-center mt-8">
            <Button variant="outline" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}