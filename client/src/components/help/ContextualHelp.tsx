import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ExternalLink, Lightbulb, BookOpen, Users, Code } from "lucide-react";

interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
  resources?: { title: string; url: string; type: 'docs' | 'video' | 'guide' }[];
}

interface ContextualHelpProps {
  topic: string;
  content: HelpContent;
  className?: string;
  variant?: "inline" | "tooltip" | "modal";
}

const helpDatabase: Record<string, HelpContent> = {
  cloudInfrastructure: {
    title: "Cloud Infrastructure Selection",
    description: "Choose all cloud platforms your organization uses for hosting applications, data storage, or computing resources.",
    examples: [
      "AWS for web applications and databases",
      "Microsoft Azure for Active Directory integration",
      "Google Cloud Platform for analytics and machine learning",
      "Multi-cloud setup with AWS primary and Azure backup"
    ],
    tips: [
      "Include all platforms where you store sensitive data",
      "Consider both primary and backup cloud providers",
      "Include platforms used by third-party vendors on your behalf"
    ],
    resources: [
      { title: "Cloud Security Best Practices", url: "#", type: "docs" },
      { title: "Multi-Cloud Compliance Guide", url: "#", type: "guide" }
    ]
  },
  dataClassification: {
    title: "Data Classification Levels",
    description: "Select the highest level of data sensitivity your organization handles. This determines compliance requirements and security controls.",
    examples: [
      "Public: Marketing materials, published research",
      "Internal: Employee directories, internal procedures", 
      "Confidential: Customer data, financial records",
      "Restricted: Government classified, healthcare PHI"
    ],
    tips: [
      "Choose the highest classification level that applies",
      "Consider regulatory requirements (HIPAA, GDPR, etc.)",
      "Document types determine minimum security controls needed"
    ]
  },
  businessApplications: {
    title: "Business Applications Description", 
    description: "Describe your primary business systems, applications, and IT infrastructure that need compliance coverage.",
    examples: [
      "CRM system (Salesforce), ERP system (SAP), custom web applications",
      "E-commerce platform, payment processing, customer support systems",
      "Healthcare management system, electronic health records (EHR)",
      "Financial trading platform, risk management systems"
    ],
    tips: [
      "Include both cloud-based and on-premises systems",
      "Mention any custom-developed applications",
      "List systems that handle sensitive data",
      "Include third-party integrations and APIs"
    ]
  },
  frameworkSelection: {
    title: "Compliance Framework Selection",
    description: "Choose the compliance framework that best matches your industry requirements and business needs.",
    examples: [
      "ISO 27001: Global information security standard",
      "SOC 2 Type 2: Service provider security controls", 
      "FedRAMP: U.S. government cloud security requirements",
      "NIST 800-53: Federal information systems security"
    ],
    tips: [
      "ISO 27001: Best for general business and international compliance",
      "SOC 2: Required for SaaS and cloud service providers",
      "FedRAMP: Mandatory for U.S. government contractors",
      "NIST: Comprehensive framework for federal systems"
    ]
  },
  documentGeneration: {
    title: "AI Document Generation Process",
    description: "Our AI analyzes your company profile and generates comprehensive, framework-specific compliance documentation tailored to your organization.",
    tips: [
      "Ensure your company profile is complete for best results",
      "Generation typically takes 2-5 minutes per framework",
      "Review and customize generated documents before approval",
      "Documents are generated using the latest compliance standards"
    ],
    resources: [
      { title: "Document Generation Guide", url: "#", type: "guide" },
      { title: "Customization Best Practices", url: "#", type: "docs" }
    ]
  }
};

export function ContextualHelp({ topic, content, className, variant = "inline" }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const helpContent = content || helpDatabase[topic];
  
  if (!helpContent) return null;



  if (variant === "tooltip" || variant === "modal") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className={`p-1 h-auto ${className}`}>
            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{helpContent.title}</span>
            </DialogTitle>
            <DialogDescription className="text-base">
              {helpContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {helpContent.examples && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Examples
                </h4>
                <ul className="space-y-2">
                  {helpContent.examples.map((example, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {helpContent.tips && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Tips
                </h4>
                <ul className="space-y-2">
                  {helpContent.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="inline-block w-1 h-1 bg-green-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {helpContent.resources && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Additional Resources
                </h4>
                <div className="space-y-2">
                  {helpContent.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                      <span className="text-blue-600 dark:text-blue-400">{resource.title}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <HelpCircle className="h-4 w-4" />
          <span>{helpContent.title}</span>
        </CardTitle>
        <CardDescription className="text-sm">
          {helpContent.description}
        </CardDescription>
      </CardHeader>
      
      {(helpContent.examples || helpContent.tips) && (
        <CardContent className="pt-0 space-y-4">
          {helpContent.examples && (
            <div>
              <h5 className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-2">Examples:</h5>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {helpContent.examples.slice(0, 2).map((example, index) => (
                  <li key={index}>• {example}</li>
                ))}
              </ul>
            </div>
          )}
          
          {helpContent.tips && (
            <div>
              <h5 className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-2">Tips:</h5>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {helpContent.tips.slice(0, 2).map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function HelpTooltip({ topic, className }: { topic: string; className?: string }) {
  return (
    <ContextualHelp 
      topic={topic} 
      content={helpDatabase[topic]} 
      variant="tooltip" 
      className={className} 
    />
  );
}