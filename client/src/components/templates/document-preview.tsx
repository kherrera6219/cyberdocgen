import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileText, Clock, Star } from "lucide-react";

interface DocumentTemplate {
  title: string;
  description: string;
  category: string;
  priority: number;
  estimatedTime?: string;
  complexity?: 'Basic' | 'Intermediate' | 'Advanced';
  preview: string;
}

interface DocumentPreviewProps {
  templates: DocumentTemplate[];
  framework: string;
}

const COMPLEXITY_LEVELS = ['Basic', 'Intermediate', 'Advanced'] as const;

export function DocumentPreview({ templates, framework }: DocumentPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'Basic':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-4 h-4";
    switch (category.toLowerCase()) {
      case 'policy':
        return <FileText className={iconClass} />;
      case 'procedure':
        return <Clock className={iconClass} />;
      case 'assessment':
        return <Star className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const mockTemplateData = useMemo(() => templates.map((template, index) => {
    const seed = template.title.length + template.priority + framework.length + index;
    const estimatedMinutes = (seed % 15) + 5;
    const complexity = COMPLEXITY_LEVELS[seed % COMPLEXITY_LEVELS.length];

    return {
      ...template,
      estimatedTime: `${estimatedMinutes} min`,
      complexity,
      preview: `# ${template.title}

## Purpose and Scope
This document establishes the framework for ${template.title.toLowerCase()} in accordance with ${framework} requirements. It applies to all organizational assets, personnel, and information systems.

## Policy Statement
${template.description} This policy ensures comprehensive coverage of security controls and compliance requirements while maintaining operational efficiency.

### Key Objectives:
- Establish clear guidelines and procedures
- Ensure regulatory compliance
- Minimize security risks
- Enable continuous improvement

## Roles and Responsibilities
- **Chief Information Security Officer (CISO)**: Overall accountability
- **IT Security Team**: Implementation and monitoring
- **Department Managers**: Compliance within their areas
- **All Employees**: Adherence to established procedures

## Implementation Guidelines
1. **Assessment Phase**: Evaluate current state and identify gaps
2. **Planning Phase**: Develop implementation timeline and resource allocation  
3. **Execution Phase**: Deploy controls and procedures
4. **Monitoring Phase**: Continuous compliance monitoring and improvement

This is a preview of the full document that would be generated based on your company profile...`
    };
  }), [templates, framework]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{framework} Document Templates</h3>
        <Badge variant="outline" className="ml-2">
          {templates.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplateData.map((template, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-sm font-medium leading-tight">
                    {template.title}
                  </CardTitle>
                </div>
                <span className="text-xs text-gray-500">#{template.priority}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </Badge>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {template.estimatedTime}
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <span>{template.title}</span>
                      <Badge className={getComplexityColor(template.complexity)}>
                        {template.complexity}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      Preview of the {template.title} template content for {template.category} compliance documentation.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <ScrollArea className="h-96">
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                        {template.preview}
                      </pre>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Template Information</h4>
        <p className="text-sm text-blue-800">
          These templates will be customized based on your company profile including industry,
          size, cloud infrastructure, and specific business requirements. The AI will generate
          comprehensive, actionable documents tailored to your organization.
        </p>
      </div>
    </div>
  );
}
