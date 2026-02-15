import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, FileText, Users, BarChart3, Clock, Award, ArrowRight,
  Zap, Lock, Bot, CheckCircle, Upload, Eye, RefreshCw, Bell, Workflow,
  Database, Cloud, Settings, GitBranch, Brain, Sparkles, Cpu
} from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicHeader";

import aiDocGenImage from "@assets/generated_images/ai_document_generation_interface.webp";
import multiFrameworkImage from "@assets/generated_images/multi-framework_compliance_support.webp";
import gapAnalysisImage from "@assets/generated_images/gap_analysis_dashboard_interface.webp";
import teamCollabImage from "@assets/generated_images/team_collaboration_workspace.webp";
import auditorWorkspaceImage from "@assets/generated_images/auditor_workspace_interface.webp";
import continuousMonitoringImage from "@assets/generated_images/continuous_monitoring_dashboard.webp";

export default function Features() {
  const mainFeatures = [
    {
      icon: Bot,
      title: "AI-Powered Document Generation",
      description: "Generate comprehensive compliance documents in minutes using advanced AI. Our multi-model system leverages GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro to create tailored policies, procedures, and assessments.",
      highlights: ["Multi-model AI (GPT-5.1, Claude, Gemini)", "Context-aware content", "Multiple document types", "Automatic formatting"],
      image: aiDocGenImage
    },
    {
      icon: Shield,
      title: "Multi-Framework Support",
      description: "Complete coverage for the industry's most important compliance frameworks, with automatic control mapping and cross-framework alignment.",
      highlights: ["ISO 27001", "SOC 2 Type II", "FedRAMP", "NIST CSF", "HIPAA", "PCI DSS"],
      image: multiFrameworkImage
    },
    {
      icon: BarChart3,
      title: "Gap Analysis & Assessment",
      description: "Identify compliance gaps instantly with AI-powered assessment. Get prioritized remediation plans and track progress toward certification.",
      highlights: ["Automated gap detection", "Priority scoring", "Remediation tracking", "Progress dashboards"],
      image: gapAnalysisImage
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with role-based access control, approval workflows, and real-time collaboration features.",
      highlights: ["Role-based permissions", "Approval workflows", "Comments & mentions", "Activity tracking"],
      image: teamCollabImage
    },
    {
      icon: Eye,
      title: "Auditor Workspace",
      description: "Dedicated read-only workspace for auditors with organized evidence packages and streamlined access to all compliance artifacts.",
      highlights: ["Read-only access", "Evidence packages", "Document export", "Audit trail"],
      image: auditorWorkspaceImage
    },
    {
      icon: RefreshCw,
      title: "Continuous Monitoring",
      description: "Stay compliant with automated control monitoring, real-time alerts, and continuous compliance dashboards.",
      highlights: ["Real-time monitoring", "Automated alerts", "Trend analysis", "Compliance scoring"],
      image: continuousMonitoringImage
    }
  ];

  const additionalFeatures = [
    { icon: Upload, title: "Evidence Management", description: "Upload, organize, and link evidence to controls with automatic categorization." },
    { icon: Workflow, title: "Approval Workflows", description: "Configurable multi-stage approval processes for documents and controls." },
    { icon: GitBranch, title: "Version Control", description: "Full document version history with diff comparison and rollback capabilities." },
    { icon: Bell, title: "Smart Notifications", description: "Get notified about pending approvals, upcoming deadlines, and compliance changes." },
    { icon: Database, title: "Secure Storage", description: "Enterprise-grade AES-256 encrypted storage for all your compliance documents and evidence." },
    { icon: Cloud, title: "Cloud Integrations", description: "Connect with Google Drive, OneDrive, and other cloud storage providers." },
    { icon: Clock, title: "Audit Trail", description: "Comprehensive audit logging of all activities for complete accountability." },
    { icon: Settings, title: "Custom Templates", description: "Create and manage custom document templates for your organization." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Powerful Features for Modern Compliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need for
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Compliance Success
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            From AI-powered document generation to continuous monitoring, CyberDocGen provides a complete platform for managing your compliance journey.
          </p>
          <Button asChild size="lg" data-testid="button-start-free-trial">
            <Link href="/login">
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Models Banner */}
      <div className="py-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-8">
            <h2 className="text-2xl font-bold mb-2">Powered by Leading AI Models</h2>
            <p className="text-blue-100">Intelligent routing selects the best model for each task</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: "GPT-5.1", provider: "OpenAI", icon: Brain },
              { name: "Claude Opus 4.5", provider: "Anthropic", icon: Sparkles },
              { name: "Gemini 3.0 Pro", provider: "Google", icon: Cpu },
            ].map((model) => (
              <div key={model.name} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <model.icon className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold text-white">{model.name}</p>
                  <p className="text-xs text-blue-200">{model.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-16 bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Core Features</h2>
          <div className="space-y-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
                <div className="flex-1">
                  <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-auto object-cover rounded-md"
                        data-testid={`img-feature-${index}`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">More Powerful Features</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Beyond the core functionality, CyberDocGen includes everything you need to manage compliance at scale.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="border-0 bg-card shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Frameworks Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Supported Frameworks</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Generate documentation for all major compliance frameworks with built-in control mapping.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {["ISO 27001", "SOC 2", "FedRAMP", "NIST CSF", "HIPAA", "PCI DSS"].map((framework) => (
              <Card key={framework} className="border-0 bg-card shadow-sm text-center">
                <CardContent className="pt-6">
                  <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">{framework}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Beta Program</Badge>
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Compliance Process?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our beta program and experience the power of AI-driven compliance automation. Free during beta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-start-trial">
              <Link href="/login">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-view-pricing">
              <Link href="/contact">
                Request Beta Access
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

